export type GoalRecord = { id: string; goalId: string; date: string; amount: number; note: string; balance: number };
export type GoalData = { id: string; title: string; subtitle: string; icon: string; status: string; current: number; target: number; estimate: string; muted?: boolean; records: GoalRecord[] };
export type CompletedGoal = { id: string; title: string; completedAt: string; amount: number };
export type Account = { id: string; name: string; quadrant: string; amount: number; performance: string; icon: string; accent: "light" | "deep"; path: string };
export type StrategyQuadrant = "现金账户" | "保障账户" | "投资账户" | "养老账户";
export type StrategyPlan = { allocations: Record<StrategyQuadrant, number>; accountIds: Record<StrategyQuadrant, string | null> };
export type FinanceData = { goals: GoalData[]; completedGoals: CompletedGoal[]; accounts: Account[]; transactions: Array<{ id: string; accountId?: string; title: string; date: string; amount: number; detail: string; icon: string }>; strategySteady: number; strategyPlan: StrategyPlan; summary: { totalAssets: number; targetTotal: number; currentTotal: number; progress: number } };

export async function financeRequest<T = FinanceData>(body?: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/finance", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "数据操作失败");
  return payload;
}
