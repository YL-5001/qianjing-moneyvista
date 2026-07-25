export type GoalRecord = { id: string; goalId: string; date: string; amount: number; note: string; balance: number };
export type GoalData = { id: string; title: string; subtitle: string; icon: string; status: string; current: number; target: number; estimate: string; muted?: boolean; records: GoalRecord[] };
export type Account = { id: string; name: string; quadrant: string; amount: number; performance: string; icon: string; accent: "light" | "deep"; path: string };
export type FinanceData = { goals: GoalData[]; accounts: Account[]; transactions: Array<{ id: string; accountId?: string; title: string; date: string; amount: number; detail: string; icon: string }>; strategySteady: number; summary: { totalAssets: number; targetTotal: number; currentTotal: number; progress: number } };

export async function financeRequest<T = FinanceData>(body?: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/finance", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "数据操作失败");
  return payload;
}
