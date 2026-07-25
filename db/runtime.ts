export type GoalRow = {
  id: string; title: string; subtitle: string; icon: string; status: string;
  current: number; target: number; estimate: string; muted: number;
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export async function getDb(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  return env.DB as D1Database;
}

export async function ensureDatabase(db?: D1Database) {
  const database = db ?? await getDb();
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL, icon TEXT NOT NULL, status TEXT NOT NULL, current_amount INTEGER NOT NULL DEFAULT 0, target_amount INTEGER NOT NULL, estimate TEXT NOT NULL, muted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS goal_records (id TEXT PRIMARY KEY, goal_id TEXT NOT NULL, date TEXT NOT NULL, amount INTEGER NOT NULL, note TEXT NOT NULL, balance INTEGER NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE)"),
    database.prepare("CREATE INDEX IF NOT EXISTS goal_records_goal_date_idx ON goal_records(goal_id, date)"),
    database.prepare("CREATE TABLE IF NOT EXISTS asset_accounts (id TEXT PRIMARY KEY, name TEXT NOT NULL, quadrant TEXT NOT NULL, amount INTEGER NOT NULL, performance TEXT NOT NULL, icon TEXT NOT NULL, accent TEXT NOT NULL, path TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS asset_transactions (id TEXT PRIMARY KEY, account_id TEXT, title TEXT NOT NULL, date TEXT NOT NULL, amount INTEGER NOT NULL, detail TEXT NOT NULL, icon TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(account_id) REFERENCES asset_accounts(id) ON DELETE SET NULL)"),
    database.prepare("CREATE INDEX IF NOT EXISTS asset_transactions_date_idx ON asset_transactions(date)"),
  ]);
  const initialized = await database.prepare("SELECT value FROM settings WHERE key = ?").bind("seeded").first<{ value: string }>();
  if (initialized) return;

  const createdAt = now();
  const seededGoals = [
    ["house", "买房基金", "首套住房置业计划", "paid", "进行中", 650000, 1000000, "18个月", 0],
    ["travel", "环球旅行", "极光与热带雨林探索", "public", "加速中", 164000, 200000, "4个月", 0],
    ["retirement", "退休储备", "悦享晚年生活保障", "account_balance_wallet", "长跑中", 480000, 5000000, "20年", 1],
  ] as const;
  const seededRecords = [
    ["house-3", "house", "2026-07-19", 5000, "工资结余", 650000], ["house-2", "house", "2026-06-28", 2000, "月度储蓄", 645000], ["house-1", "house", "2026-06-12", 3000, "投资收益", 643000],
    ["travel-3", "travel", "2026-07-10", 8000, "旅行专项储蓄", 164000], ["travel-2", "travel", "2026-06-16", 4500, "项目奖金", 156000], ["travel-1", "travel", "2026-05-30", 3000, "月度储蓄", 151500],
    ["retirement-3", "retirement", "2026-07-01", 6000, "定期投入", 480000], ["retirement-2", "retirement", "2026-06-01", 6000, "定期投入", 474000], ["retirement-1", "retirement", "2026-05-01", 6000, "定期投入", 468000],
  ] as const;
  const seededAccounts = [
    ["cash", "现金账户", "Q1", 245000, "随时可用", "account_balance_wallet", "light", "M0 42 Q25 38 50 31 T100 18"],
    ["deposit", "活期/定存", "Q1/Q2", 820000, "2.4% 年化", "savings", "light", "M0 40 Q25 35 50 25 T100 10"],
    ["investment", "高风险投资", "Q3", 1240000, "12.8% 本季收益", "show_chart", "deep", "M0 45 Q20 40 40 20 T100 5"],
    ["pension", "养老账户", "Q4", 145000, "长期配置", "elderly", "light", "M0 42 Q25 36 48 30 T75 18 T100 12"],
  ] as const;
  await database.batch([
    ...seededGoals.map((goal) => database.prepare("INSERT INTO goals (id,title,subtitle,icon,status,current_amount,target_amount,estimate,muted,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(...goal, createdAt, createdAt)),
    ...seededRecords.map((record) => database.prepare("INSERT INTO goal_records (id,goal_id,date,amount,note,balance,created_at) VALUES (?,?,?,?,?,?,?)").bind(...record, createdAt)),
    ...seededAccounts.map((account) => database.prepare("INSERT INTO asset_accounts (id,name,quadrant,amount,performance,icon,accent,path,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(...account, createdAt, createdAt)),
    database.prepare("INSERT INTO asset_transactions (id,account_id,title,date,amount,detail,icon,created_at) VALUES (?,?,?,?,?,?,?,?)").bind("transaction-seed-1", "investment", "标普500指数基金 - 分红 (Q3)", "2026-07-24 14:30", 1240, "已存入余额", "trending_up", createdAt),
    database.prepare("INSERT INTO asset_transactions (id,account_id,title,date,amount,detail,icon,created_at) VALUES (?,?,?,?,?,?,?,?)").bind("transaction-seed-2", "investment", "招商银行卡 - 资金转移", "2026-07-23 09:15", -50000, "转至 高风险投资", "sync_alt", createdAt),
    database.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,?)").bind("strategy_steady", "60", createdAt),
    database.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,?)").bind("seeded", "true", createdAt),
  ]);
}

export async function readFinanceData(db?: D1Database) {
  const database = db ?? await getDb();
  await ensureDatabase(database);
  const [goalResult, recordResult, accountResult, transactionResult, settingsResult] = await database.batch([
    database.prepare("SELECT id,title,subtitle,icon,status,current_amount AS current,target_amount AS target,estimate,muted FROM goals ORDER BY created_at ASC"),
    database.prepare("SELECT id,goal_id AS goalId,date,amount,note,balance FROM goal_records ORDER BY date DESC, created_at DESC"),
    database.prepare("SELECT id,name,quadrant,amount,performance,icon,accent,path FROM asset_accounts ORDER BY created_at ASC"),
    database.prepare("SELECT id,account_id AS accountId,title,date,amount,detail,icon FROM asset_transactions ORDER BY date DESC, created_at DESC LIMIT 20"),
    database.prepare("SELECT key,value FROM settings WHERE key = ?").bind("strategy_steady"),
  ]);
  const records = (recordResult.results ?? []) as Array<{ id: string; goalId: string; date: string; amount: number; note: string; balance: number }>;
  const goals = ((goalResult.results ?? []) as GoalRow[]).map((goal) => ({ ...goal, muted: Boolean(goal.muted), records: records.filter((record) => record.goalId === goal.id) }));
  const accounts = accountResult.results ?? [];
  const totalAssets = accounts.reduce((sum, account) => sum + Number((account as { amount: number }).amount), 0);
  const targetTotal = goals.reduce((sum, goal) => sum + goal.target, 0);
  const currentTotal = goals.reduce((sum, goal) => sum + goal.current, 0);
  const setting = (settingsResult[0]?.results?.[0] as { value?: string } | undefined)?.value;
  return { goals, accounts, transactions: transactionResult.results ?? [], strategySteady: Number(setting ?? 60), summary: { totalAssets, targetTotal, currentTotal, progress: targetTotal ? Math.round((currentTotal / targetTotal) * 100) : 0 } };
}

export async function createGoal(input: { title: string; target: number; current: number }) {
  const db = await getDb(); await ensureDatabase(db);
  if (!input.title || !Number.isFinite(input.target) || input.target <= 0) throw new Error("请填写目标名称和有效金额");
  const createdAt = now(); const goalId = id("goal");
  const icon = matchGoalIcon(input.title);
  const statements = [db.prepare("INSERT INTO goals (id,title,subtitle,icon,status,current_amount,target_amount,estimate,muted,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(goalId, input.title, `为「${input.title}」稳步积累`, icon, "新目标", input.current, input.target, "待规划", 0, createdAt, createdAt)];
  if (input.current > 0) statements.push(db.prepare("INSERT INTO goal_records (id,goal_id,date,amount,note,balance,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("record"), goalId, today(), input.current, "初始金额", input.current, createdAt));
  await db.batch(statements); return readFinanceData(db);
}

export async function updateGoal(idValue: string, input: { title?: string; target?: number }) {
  const db = await getDb(); await ensureDatabase(db);
  const old = await db.prepare("SELECT title FROM goals WHERE id = ?").bind(idValue).first<{ title: string }>();
  if (!old) throw new Error("目标不存在");
  const title = input.title?.trim() || old.title;
  const target = input.target;
  if (target !== undefined && (!Number.isFinite(target) || target <= 0)) throw new Error("目标金额无效");
  await db.prepare("UPDATE goals SET title = ?, icon = ?, target_amount = COALESCE(?, target_amount), updated_at = ? WHERE id = ?").bind(title, matchGoalIcon(title), target ?? null, now(), idValue).run();
  return readFinanceData(db);
}

export async function adjustGoal(idValue: string, amount: number, note: string) {
  const db = await getDb(); await ensureDatabase(db);
  if (!Number.isFinite(amount) || amount === 0) throw new Error("请输入有效金额");
  const goal = await db.prepare("SELECT current_amount AS current FROM goals WHERE id = ?").bind(idValue).first<{ current: number }>();
  if (!goal) throw new Error("目标不存在");
  const next = Math.max(0, goal.current + amount); const applied = next - goal.current;
  if (!applied) throw new Error("当前累计已为 ¥ 0");
  const time = now();
  await db.batch([
    db.prepare("UPDATE goals SET current_amount = ?, updated_at = ? WHERE id = ?").bind(next, time, idValue),
    db.prepare("INSERT INTO goal_records (id,goal_id,date,amount,note,balance,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("record"), idValue, today(), applied, note, next, time),
  ]);
  return readFinanceData(db);
}

export async function createAccount(input: { name: string; amount: number; quadrant: string }) {
  const db = await getDb(); await ensureDatabase(db);
  if (!input.name || !Number.isFinite(input.amount) || input.amount <= 0) throw new Error("请填写资产名称和有效金额");
  const createdAt = now(); const investment = input.quadrant.includes("投资");
  await db.prepare("INSERT INTO asset_accounts (id,name,quadrant,amount,performance,icon,accent,path,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(id("asset"), input.name, input.quadrant, input.amount, "新加入资产", investment ? "show_chart" : "account_balance", investment ? "deep" : "light", "M0 42 Q25 36 48 30 T75 18 T100 12", createdAt, createdAt).run();
  return readFinanceData(db);
}

export async function updateAccount(idValue: string, input: { name: string; amount: number; quadrant: string }) {
  const db = await getDb(); await ensureDatabase(db);
  if (!input.name.trim() || !Number.isFinite(input.amount) || input.amount < 0) throw new Error("请填写账户名称和有效金额");
  if (!input.quadrant.trim()) throw new Error("请选择所属资产象限");
  const result = await db.prepare("UPDATE asset_accounts SET name = ?, amount = ?, quadrant = ?, updated_at = ? WHERE id = ?").bind(input.name.trim(), input.amount, input.quadrant, now(), idValue).run();
  if (!result.meta.changes) throw new Error("账户不存在");
  return readFinanceData(db);
}

export async function deleteAccount(idValue: string) {
  const db = await getDb(); await ensureDatabase(db);
  const result = await db.prepare("DELETE FROM asset_accounts WHERE id = ?").bind(idValue).run();
  if (!result.meta.changes) throw new Error("账户不存在");
  return readFinanceData(db);
}

export async function saveSavings(input: { amount: number; remark: string }) {
  const db = await getDb(); await ensureDatabase(db);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("请输入有效金额");
  const goal = await db.prepare("SELECT id FROM goals ORDER BY created_at ASC LIMIT 1").first<{ id: string }>();
  if (!goal) throw new Error("请先创建一个目标");
  return adjustGoal(goal.id, input.amount, input.remark || "今日攒钱");
}

export async function setStrategy(steady: number) {
  const db = await getDb(); await ensureDatabase(db);
  if (!Number.isFinite(steady) || steady < 0 || steady > 100) throw new Error("配置比例无效");
  await db.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind("strategy_steady", String(Math.round(steady)), now()).run();
  return readFinanceData(db);
}

function matchGoalIcon(title: string) {
  const rules: Array<[RegExp, string]> = [[/(房|住宅|公寓|装修|置业)/, "home"], [/(车|汽车|摩托|交通)/, "directions_car"], [/(旅行|旅游|环球|度假|出国)/, "public"], [/(教育|学习|学校|留学|课程)/, "school"], [/(医疗|健康|看病|手术|保险)/, "health_and_safety"], [/(退休|养老|晚年)/, "account_balance_wallet"], [/(创业|事业|公司|生意)/, "rocket_launch"], [/(婚礼|结婚|婚姻)/, "favorite"], [/(电脑|手机|数码|设备)/, "devices"], [/(应急|备用|储备)/, "savings"]];
  return rules.find(([pattern]) => pattern.test(title))?.[1] ?? "flag";
}
