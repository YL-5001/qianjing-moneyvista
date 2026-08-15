import { NextResponse } from "next/server";
import { adjustGoal, createAccount, createGoal, deleteAccount, deleteCompletedGoal, deleteGoal, readFinanceData, saveSavings, setStrategy, setStrategyPlan, updateAccount, updateGoal } from "../../../db/runtime";

export const dynamic = "force-dynamic";

const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  try { return NextResponse.json(await readFinanceData()); } catch (cause) { return error(cause instanceof Error ? cause.message : "暂时无法读取数据", 500); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    let result;
    if (action === "createGoal") result = await createGoal({ title: String(body.title ?? "").trim(), target: Number(body.target), current: Math.max(0, Number(body.current) || 0) });
    else if (action === "updateGoal") result = await updateGoal(String(body.id), { title: typeof body.title === "string" ? body.title : undefined, target: body.target === undefined ? undefined : Number(body.target) });
    else if (action === "adjustGoal") result = await adjustGoal(String(body.id), Number(body.amount), String(body.note ?? "手动调整"));
    else if (action === "deleteGoal") result = await deleteGoal(String(body.id));
    else if (action === "deleteCompletedGoal") result = await deleteCompletedGoal(String(body.id));
    else if (action === "createAccount") result = await createAccount({ name: String(body.name ?? "").trim(), amount: Number(body.amount), quadrant: String(body.quadrant ?? "其他账户") });
    else if (action === "updateAccount") result = await updateAccount(String(body.id), { name: String(body.name ?? ""), amount: Number(body.amount), quadrant: String(body.quadrant ?? "") });
    else if (action === "deleteAccount") result = await deleteAccount(String(body.id));
    else if (action === "saveSavings") result = await saveSavings({ amount: Number(body.amount), remark: String(body.remark ?? "") });
    else if (action === "setStrategy") result = await setStrategy(Number(body.steady));
    else if (action === "setStrategyPlan") result = await setStrategyPlan(body.plan as Parameters<typeof setStrategyPlan>[0]);
    else return error("不支持的操作");
    return NextResponse.json(result);
  } catch (cause) { return error(cause instanceof Error ? cause.message : "保存失败"); }
}
