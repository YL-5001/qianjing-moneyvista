"use client";

import { FormEvent, useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { financeRequest, type FinanceData } from "../lib/finance";

type Account = {
  id: string;
  name: string;
  quadrant: string;
  amount: number;
  performance: string;
  icon: string;
  accent: "light" | "deep";
  path: string;
};

const INITIAL_ACCOUNTS: Account[] = [
  { id: "deposit", name: "活期/定存", quadrant: "Q1/Q2", amount: 820000, performance: "2.4% 年化", icon: "savings", accent: "light", path: "M0 40 Q25 35 50 25 T100 10" },
  { id: "investment", name: "高风险投资", quadrant: "Q3", amount: 1240000, performance: "12.8% 本季收益", icon: "show_chart", accent: "deep", path: "M0 45 Q20 40 40 20 T100 5" },
];

const quadrants = [
  { id: "cash", label: "现金账户", ratio: "10%", amount: "¥ 245k", status: "正常", color: "#0c6780", offset: 143.2, rotation: 0 },
  { id: "protection", label: "保障账户", ratio: "20%", amount: "¥ 490k", status: "正常", color: "#0372e4", offset: 167.1, rotation: 144 },
  { id: "investment", label: "投资账户", ratio: "30%", amount: "¥ 857k", status: "+5% 失衡", color: "#87ceeb", offset: 191, rotation: 252, warning: true },
  { id: "pension", label: "养老账户", ratio: "40%", amount: "¥ 858k", status: "正常", color: "#baeaff", offset: 214.8, rotation: 324 },
] as const;

const goals = [
  { name: "买房基金", progress: 65, path: "M0 35 Q50 30 100 20 T200 5" },
  { name: "退休储备", progress: 12, path: "M0 38 L50 35 L100 32 L150 30 L200 28" },
  { name: "环球旅行", progress: 82, path: "M0 35 Q40 30 80 25 T160 10 T200 6" },
] as const;

const bills = [
  { id: "dividend", icon: "trending_up", title: "标普500指数基金 - 分红 (Q3)", date: "2024-05-24 14:30", amount: "+ ¥ 1,240.00", detail: "已存入余额", positive: true },
  { id: "transfer", icon: "sync_alt", title: "招商银行卡 - 资金转移", date: "2024-05-23 09:15", amount: "- ¥ 50,000.00", detail: "转至 高风险投资", positive: false },
] as const;

const formatCurrency = (value: number) => `¥ ${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(value)}`;

export default function AssetsPage() {
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);
  const [optimized, setOptimized] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [billFilter, setBillFilter] = useState<"all" | "month">("all");
  const [finance, setFinance] = useState<FinanceData | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFormOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => { financeRequest().then((data) => { setFinance(data); setAccounts(data.accounts); }).catch(() => undefined); }, []);

  const selectedQuadrant = quadrants.find((item) => item.id === activeQuadrant);
  const totalAssets = finance?.summary.totalAssets ?? 2450000;
  const goalPaths = ["M0 35 Q50 30 100 20 T200 5", "M0 38 L50 35 L100 32 L150 30 L200 28", "M0 35 Q40 30 80 25 T160 10 T200 6"];
  const goalRows = finance ? finance.goals.map((goal, index) => ({ name: goal.title, progress: Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100)), path: goalPaths[index % goalPaths.length] })) : goals;
  const billRows = finance?.transactions?.length ? finance.transactions.map((bill) => ({ ...bill, positive: bill.amount >= 0, amountLabel: `${bill.amount >= 0 ? "+" : "-"} ¥ ${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(Math.abs(bill.amount))}` })) : bills.map((bill) => ({ ...bill, amountLabel: bill.amount }));

  const createAsset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("asset-name") ?? "").trim();
    const amount = Number(values.get("asset-amount"));
    const category = String(values.get("asset-category") ?? "其他账户");
    if (!name || !Number.isFinite(amount) || amount <= 0) return;

    try {
      const data = await financeRequest<FinanceData>({ action: "createAccount", name, amount, quadrant: category });
      setFinance(data); setAccounts(data.accounts); setCreated(true);
      window.setTimeout(() => { setFormOpen(false); setCreated(false); form.reset(); }, 850);
    } catch { setCreated(false); }
  };

  return (
    <>
      <SiteHeader active="assets" />

      <main className="assets-page">
        <div className="assets-shell">
          <section className={`rebalance-banner ${optimized ? "optimized" : ""}`} aria-live="polite">
            <div className="rebalance-message">
              <span className="material-symbols-outlined" aria-hidden="true">{optimized ? "verified" : "warning"}</span>
              <div>
                <strong>{optimized ? "资产配置优化方案已生成" : "配置失衡预警：您的“投资”象限比重超出目标 5%"}</strong>
                <p>{optimized ? "建议方案已保存，您可以在报告中查看详细调仓路径。" : "建议通过资产再平衡将波动回归标准普尔家庭资产象限目标。"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOptimized(true)} disabled={optimized}>{optimized ? "已优化" : "立即优化"}</button>
          </section>

          <header className="assets-hero">
            <h1>我的资产</h1>
            <div className="assets-hero-row">
              <div>
                <div className="assets-total"><span>¥</span><strong>{new Intl.NumberFormat("zh-CN").format(totalAssets)}</strong></div>
                <p className="assets-daily"><span className="material-symbols-outlined" aria-hidden="true">trending_up</span> 较昨日 +¥12,450 (0.51%)</p>
              </div>
              <div className="assets-goal-total">
                <span>财富目标总进度</span>
                <div><strong>{finance?.summary.progress ?? 45}%</strong><div className="assets-mini-progress"><span style={{ width: `${finance?.summary.progress ?? 45}%` }} /></div></div>
              </div>
            </div>
          </header>

          <section className="assets-primary-grid" aria-label="资产配置与账户明细">
            <article className="asset-panel quadrant-panel">
              <div className="asset-panel-heading">
                <div><h2>标准普尔资产象限</h2><p>S&amp;P 500 家庭财富结构分析</p></div>
                <button type="button" aria-label="查看资产象限说明"><span className="material-symbols-outlined" aria-hidden="true">info</span></button>
              </div>
              <div className="quadrant-content">
                <div className="quadrant-chart">
                  <svg viewBox="0 0 100 100" role="img" aria-label="标准普尔资产配置环形图">
                    <circle className="quadrant-track" cx="50" cy="50" r="38" />
                    {quadrants.map((item) => (
                      <circle
                        key={item.id}
                        className={`quadrant-segment ${activeQuadrant === item.id ? "active" : ""}`}
                        cx="50" cy="50" r="38"
                        stroke={item.color}
                        strokeDasharray="238.7"
                        strokeDashoffset={item.offset}
                        transform={`rotate(${item.rotation} 50 50)`}
                        tabIndex={0}
                        onMouseEnter={() => setActiveQuadrant(item.id)}
                        onMouseLeave={() => setActiveQuadrant(null)}
                        onFocus={() => setActiveQuadrant(item.id)}
                        onBlur={() => setActiveQuadrant(null)}
                        aria-label={`${item.label} ${item.ratio}`}
                      />
                    ))}
                  </svg>
                  <div className="quadrant-center"><span>{selectedQuadrant?.label ?? "资产配置"}</span><strong>{selectedQuadrant?.ratio ?? "稳健"}</strong></div>
                </div>
                <div className="quadrant-stats">
                  {quadrants.map((item) => (
                    <button className={item.warning ? "warning" : ""} type="button" key={item.id} onMouseEnter={() => setActiveQuadrant(item.id)} onMouseLeave={() => setActiveQuadrant(null)} onFocus={() => setActiveQuadrant(item.id)} onBlur={() => setActiveQuadrant(null)}>
                      <span>{item.label} ({item.ratio})</span>
                      <div><strong>{item.amount}</strong><small>{item.status}</small></div>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <section className="accounts-column" aria-labelledby="accounts-title">
              <div className="accounts-heading"><h2 id="accounts-title">账户明细</h2><button type="button" onClick={() => setFormOpen(true)}>管理</button></div>
              <div className="account-list">
                {accounts.map((account) => (
                  <article className={`account-card ${account.accent}`} key={account.id}>
                    <div className="account-card-top">
                      <span className="account-icon material-symbols-outlined" aria-hidden="true">{account.icon}</span>
                      <svg viewBox="0 0 100 50" aria-hidden="true"><path d={account.path} /></svg>
                    </div>
                    <p>{account.name} ({account.quadrant})</p>
                    <h3>{formatCurrency(account.amount)}</h3>
                    <span className="account-yield"><span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>{account.performance}</span>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <section className="assets-secondary-grid">
            <article className="asset-panel goal-tracking-panel">
              <div className="asset-panel-heading"><h2>目标追踪</h2><a href="/goals">详情</a></div>
              <div className="asset-goal-list">
                {goalRows.map((goal) => (
                  <a href="/goals" className="asset-goal" key={goal.name}>
                    <div><span>{goal.name}</span><strong>{goal.progress}%</strong></div>
                    <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d={goal.path} /></svg>
                    <div className="asset-goal-progress"><span style={{ width: `${goal.progress}%` }} /></div>
                  </a>
                ))}
              </div>
            </article>

            <article className="asset-panel liquidity-panel">
              <h2>资产流动性分析</h2>
              <div className="liquidity-row"><div><span>高流动性</span><strong>15%</strong></div><div className="liquidity-bar high"><span /></div></div>
              <div className="liquidity-row"><div><span>中长周期</span><strong>85%</strong></div><div className="liquidity-bar long"><span /></div></div>
            </article>
          </section>

          <section className="recent-bills" aria-labelledby="bills-title">
            <div className="bills-heading"><h2 id="bills-title">近期账单</h2><div><button className={billFilter === "all" ? "active" : ""} type="button" onClick={() => setBillFilter("all")}>全部</button><button className={billFilter === "month" ? "active" : ""} type="button" onClick={() => setBillFilter("month")}>本月</button></div></div>
            <div className="bills-card">
              {billRows.map((bill) => (
                <article className="bill-row" key={bill.id}>
                  <div className="bill-main"><span className={`bill-icon material-symbols-outlined ${bill.positive ? "positive" : ""}`} aria-hidden="true">{bill.icon}</span><div><h3>{bill.title}</h3><p>{bill.date}</p></div></div>
                  <div className="bill-value"><strong className={bill.positive ? "positive" : ""}>{bill.amountLabel}</strong><span>{bill.detail}</span></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <section className={`new-asset-popover ${formOpen ? "open" : ""}`} aria-hidden={!formOpen}>
        <h2>添加资产</h2>
        <form onSubmit={createAsset}>
          <label htmlFor="asset-name">资产名称</label><input id="asset-name" name="asset-name" placeholder="例如：招商银行储蓄" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="asset-amount">当前金额 (¥)</label><input id="asset-amount" name="asset-amount" type="number" min="1" placeholder="0.00" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="asset-category">账户类型</label><select id="asset-category" name="asset-category" tabIndex={formOpen ? 0 : -1}><option>现金账户</option><option>保障账户</option><option>投资账户</option><option>养老账户</option></select>
          <div><button type="button" onClick={() => setFormOpen(false)} tabIndex={formOpen ? 0 : -1}>取消</button><button className={created ? "created" : ""} type="submit" tabIndex={formOpen ? 0 : -1}>{created ? "添加成功" : "添加"}</button></div>
        </form>
      </section>

      <button className={`fab asset-fab ${formOpen ? "active" : ""}`} type="button" onClick={() => setFormOpen((open) => !open)} aria-label={formOpen ? "关闭添加资产表单" : "添加资产"}><span aria-hidden="true">＋</span></button>
    </>
  );
}
