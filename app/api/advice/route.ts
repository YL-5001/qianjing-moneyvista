import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { ensureDatabase, readFinanceData } from "../../../db/runtime";

export const dynamic = "force-dynamic";

const GLM_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const MODEL = "glm-4-flash-250414";
const MAX_REQUESTS_PER_HOUR = 6;
const WINDOW_MS = 60 * 60 * 1000;

function isSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function clientHash(request: Request, apiKey: string) {
  const clientIp = request.headers.get("CF-Connecting-IP") ?? "local";
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(apiKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(clientIp));
  return Array.from(new Uint8Array(signature)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(request: Request, apiKey: string) {
  const database = env.DB as D1Database;
  const now = Date.now();
  const hash = await clientHash(request, apiKey);
  await database.prepare(
    "INSERT INTO ai_request_limits (client_hash, window_started_at, request_count) VALUES (?, ?, 1) ON CONFLICT(client_hash) DO UPDATE SET window_started_at = CASE WHEN excluded.window_started_at - ai_request_limits.window_started_at >= ? THEN excluded.window_started_at ELSE ai_request_limits.window_started_at END, request_count = CASE WHEN excluded.window_started_at - ai_request_limits.window_started_at >= ? THEN 1 ELSE ai_request_limits.request_count + 1 END",
  ).bind(hash, now, WINDOW_MS, WINDOW_MS).run();
  const limit = await database.prepare("SELECT request_count AS requestCount FROM ai_request_limits WHERE client_hash = ?").bind(hash).first<{ requestCount: number }>();
  return (limit?.requestCount ?? MAX_REQUESTS_PER_HOUR + 1) <= MAX_REQUESTS_PER_HOUR;
}

export async function POST(request: Request) {
  const apiKey = (env as { GLM_API_KEY?: string }).GLM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "尚未配置 GLM_API_KEY。请在 .dev.vars 中填入智谱 API Key 后重试。" }, { status: 503 });
  }
  if (!isSameOrigin(request)) return NextResponse.json({ error: "不允许跨站调用 AI 建议服务" }, { status: 403 });

  try {
    await ensureDatabase();
    if (!await consumeRateLimit(request, apiKey)) {
      return NextResponse.json({ error: "AI 建议每小时最多生成 6 次，请稍后再试" }, { status: 429 });
    }
    const finance = await readFinanceData();
    const profile = {
      totalAssets: finance.summary.totalAssets,
      goalProgress: finance.summary.progress,
      goals: finance.goals.map((goal) => ({ title: goal.title, current: goal.current, target: goal.target, estimate: goal.estimate })),
      accounts: finance.accounts.map((account) => ({ name: account.name, quadrant: account.quadrant, amount: account.amount })),
    };
    const response = await fetch(GLM_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: "system", content: "你是谨慎的个人财务分析助手。基于用户提供的汇总数据，用中文给出一段不超过 180 字的、可执行但非投资承诺的财富建议。避免保证收益、避免高风险或具体证券推荐；提醒用户按自身风险承受能力决策。" },
          { role: "user", content: `请分析以下钱景 MoneyVista 用户的汇总数据：${JSON.stringify(profile)}` },
        ],
      }),
    });
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) throw new Error(payload.error?.message ?? "智谱服务暂时不可用");
    const advice = payload.choices?.[0]?.message?.content?.trim();
    if (!advice) throw new Error("智谱未返回有效建议");
    return NextResponse.json({ advice });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "暂时无法生成建议" }, { status: 502 });
  }
}
