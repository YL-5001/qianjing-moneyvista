"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SiteHeader } from "../components/SiteHeader";
import { financeRequest, type FinanceData } from "../lib/finance";

gsap.registerPlugin(useGSAP);

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

const quadrantDefinitions = [
  { id: "cash", label: "现金账户", target: 10, color: "#0c6780" },
  { id: "protection", label: "保障账户", target: 20, color: "#0372e4" },
  { id: "investment", label: "投资账户", target: 30, color: "#87ceeb" },
  { id: "pension", label: "养老账户", target: 40, color: "#baeaff" },
] as const;

const normalizeQuadrant = (value: string) => {
  if (value === "Q1" || value.includes("现金")) return "现金账户";
  if (value === "Q1/Q2" || value.includes("保障")) return "保障账户";
  if (value === "Q3" || value.includes("投资")) return "投资账户";
  if (value === "Q4" || value.includes("养老")) return "养老账户";
  return "现金账户";
};

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
  const pageRef = useRef<HTMLDivElement>(null);
  const accountFlipRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const flippedAccountRef = useRef<string | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);
  const [optimized, setOptimized] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [assetFormError, setAssetFormError] = useState("");
  const [billFilter, setBillFilter] = useState<"all" | "month">("all");
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [flippedAccount, setFlippedAccount] = useState<string | null>(null);
  const [accountDrafts, setAccountDrafts] = useState<Record<string, { name: string; amount: string; quadrant: string }>>({});
  const [deleteCandidate, setDeleteCandidate] = useState<Account | null>(null);
  const [accountError, setAccountError] = useState("");

  const { contextSafe } = useGSAP(() => undefined, { scope: pageRef });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setFormOpen(false); setDeleteCandidate(null); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => { financeRequest().then((data) => { setFinance(data); setAccounts(data.accounts); }).catch(() => undefined); }, []);

  const totalAssets = finance?.summary.totalAssets ?? 2450000;
  let consumedPercent = 0;
  const quadrantData = quadrantDefinitions.map((definition) => {
    const amount = accounts.filter((account) => normalizeQuadrant(account.quadrant) === definition.label).reduce((sum, account) => sum + account.amount, 0);
    const actual = totalAssets ? Math.round((amount / totalAssets) * 100) : 0;
    const item = { ...definition, amount, actual, rotation: consumedPercent * 3.6, segmentLength: actual / 100 * 238.7, warning: Math.abs(actual - definition.target) >= 6 };
    consumedPercent += actual;
    return item;
  });
  const selectedQuadrant = quadrantData.find((item) => item.id === activeQuadrant);
  const goalPaths = ["M0 35 Q50 30 100 20 T200 5", "M0 38 L50 35 L100 32 L150 30 L200 28", "M0 35 Q40 30 80 25 T160 10 T200 6"];
  const goalRows = finance ? finance.goals.map((goal, index) => ({ name: goal.title, progress: Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100)), path: goalPaths[index % goalPaths.length] })) : goals;
  const billRows = finance?.transactions?.length ? finance.transactions.map((bill) => ({ ...bill, positive: bill.amount >= 0, amountLabel: `${bill.amount >= 0 ? "+" : "-"} ¥ ${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(Math.abs(bill.amount))}` })) : bills.map((bill) => ({ ...bill, amountLabel: bill.amount }));

  const createAsset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingAsset) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("asset-name") ?? "").trim();
    const amount = Number(values.get("asset-amount"));
    const category = String(values.get("asset-category") ?? "其他账户");
    if (!name || !Number.isFinite(amount) || amount <= 0) { setAssetFormError("请填写资产名称和有效金额"); return; }

    try {
      setCreatingAsset(true);
      setAssetFormError("");
      const data = await financeRequest<FinanceData>({ action: "createAccount", name, amount, quadrant: category });
      setFinance(data);
      setAccounts(data.accounts);
      setCreated(true);
      window.setTimeout(() => { setFormOpen(false); setCreated(false); form.reset(); }, 850);
    } catch (cause) {
      setCreated(false);
      setAssetFormError(cause instanceof Error ? cause.message : "添加失败，请稍后重试");
    } finally { setCreatingAsset(false); }
  };

  const flipAccount = contextSafe((account: Account, open: boolean) => {
    const node = accountFlipRefs.current[account.id];
    if (!node) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf(node);
    gsap.to(node, { rotationX: open ? 180 : 0, duration: reduceMotion ? 0 : 0.82, ease: "back.inOut(1.22)", overwrite: "auto" });
    flippedAccountRef.current = open ? account.id : null;
    setFlippedAccount(open ? account.id : null);
    setAccountError("");
    if (open) setAccountDrafts((current) => ({ ...current, [account.id]: current[account.id] ?? { name: account.name, amount: String(account.amount), quadrant: normalizeQuadrant(account.quadrant) } }));
  });

  const handleCardKeyboard = (event: KeyboardEvent<HTMLElement>, account: Account) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flipAccount(account, true); }
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>, account: Account) => {
    event.preventDefault();
    const draft = accountDrafts[account.id] ?? { name: account.name, amount: String(account.amount), quadrant: normalizeQuadrant(account.quadrant) };
    const amount = Number(draft.amount);
    if (!draft.name.trim() || !Number.isFinite(amount) || amount < 0) { setAccountError("请填写账户名称和有效金额"); return; }
    try {
      const data = await financeRequest<FinanceData>({ action: "updateAccount", id: account.id, name: draft.name, amount, quadrant: draft.quadrant });
      setFinance(data); setAccounts(data.accounts); flipAccount(account, false);
    } catch (cause) { setAccountError(cause instanceof Error ? cause.message : "保存失败"); }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteCandidate) return;
    try {
      const data = await financeRequest<FinanceData>({ action: "deleteAccount", id: deleteCandidate.id });
      setFinance(data); setAccounts(data.accounts); setDeleteCandidate(null); setFlippedAccount(null); flippedAccountRef.current = null;
    } catch (cause) { setAccountError(cause instanceof Error ? cause.message : "删除失败"); setDeleteCandidate(null); }
  };

  return (
    <div ref={pageRef}>
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
                    {quadrantData.map((item) => (
                      <circle
                        key={item.id}
                        className={`quadrant-segment ${activeQuadrant === item.id ? "active" : ""}`}
                        cx="50" cy="50" r="38"
                        stroke={item.color}
                        strokeDasharray={`${item.segmentLength} ${238.7 - item.segmentLength}`}
                        strokeDashoffset="0"
                        transform={`rotate(${item.rotation} 50 50)`}
                        tabIndex={0}
                        onMouseEnter={() => setActiveQuadrant(item.id)}
                        onMouseLeave={() => setActiveQuadrant(null)}
                        onFocus={() => setActiveQuadrant(item.id)}
                        onBlur={() => setActiveQuadrant(null)}
                        aria-label={`${item.label} 实际占比 ${item.actual}%`}
                      />
                    ))}
                  </svg>
                  <div className="quadrant-center"><span>{selectedQuadrant?.label ?? "资产配置"}</span><strong>{selectedQuadrant ? `${selectedQuadrant.actual}%` : "总览"}</strong></div>
                </div>
                <div className="quadrant-stats">
                  {quadrantData.map((item) => (
                    <button className={item.warning ? "warning" : ""} type="button" key={item.id} onMouseEnter={() => setActiveQuadrant(item.id)} onMouseLeave={() => setActiveQuadrant(null)} onFocus={() => setActiveQuadrant(item.id)} onBlur={() => setActiveQuadrant(null)}>
                      <span>{item.label}（目标 {item.target}%）</span>
                      <div><strong>{formatCurrency(item.amount)}</strong><small>{item.actual}% 实际占比</small></div>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <section className="accounts-column" aria-labelledby="accounts-title">
              <div className="accounts-heading"><h2 id="accounts-title">账户明细</h2></div>
              <div className="account-list">
                {accounts.map((account) => (
                  <article className={`account-card-shell ${account.accent} ${flippedAccount === account.id ? "flipped" : ""}`} key={account.id}>
                    <div className="account-card-inner" ref={(node) => { accountFlipRefs.current[account.id] = node; }}>
                      <section className="account-card account-card-front" role="button" tabIndex={flippedAccount === account.id ? -1 : 0} aria-label={`编辑${account.name}`} onClick={() => flipAccount(account, true)} onKeyDown={(event) => handleCardKeyboard(event, account)}>
                        <div className="account-card-top"><span className="account-icon material-symbols-outlined" aria-hidden="true">{account.icon}</span><svg viewBox="0 0 100 50" aria-hidden="true"><path d={account.path} /></svg></div>
                        <p>{account.name} ({normalizeQuadrant(account.quadrant)})</p><h3>{formatCurrency(account.amount)}</h3><span className="account-yield"><span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>{account.performance}</span><span className="account-edit-hint"><span className="material-symbols-outlined" aria-hidden="true">edit</span> 点击编辑</span>
                      </section>
                      <form className="account-card account-card-back" onSubmit={(event) => saveAccount(event, account)} aria-hidden={flippedAccount !== account.id}>
                        <div className="account-edit-heading"><strong>编辑账户</strong><button type="button" onClick={() => flipAccount(account, false)} tabIndex={flippedAccount === account.id ? 0 : -1} aria-label={`关闭${account.name}编辑`}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div>
                        <div className="account-edit-fields"><label htmlFor={`account-name-${account.id}`}>账户名称<input id={`account-name-${account.id}`} value={accountDrafts[account.id]?.name ?? account.name} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { name: event.target.value, amount: current[account.id]?.amount ?? String(account.amount), quadrant: current[account.id]?.quadrant ?? normalizeQuadrant(account.quadrant) } }))} tabIndex={flippedAccount === account.id ? 0 : -1} /></label><label htmlFor={`account-quadrant-${account.id}`}>所属象限<select id={`account-quadrant-${account.id}`} value={accountDrafts[account.id]?.quadrant ?? normalizeQuadrant(account.quadrant)} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { name: current[account.id]?.name ?? account.name, amount: current[account.id]?.amount ?? String(account.amount), quadrant: event.target.value } }))} tabIndex={flippedAccount === account.id ? 0 : -1}>{quadrantDefinitions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}</select></label><label htmlFor={`account-amount-${account.id}`}>当前金额 (¥)<input id={`account-amount-${account.id}`} type="number" min="0" step="0.01" value={accountDrafts[account.id]?.amount ?? String(account.amount)} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { name: current[account.id]?.name ?? account.name, amount: event.target.value, quadrant: current[account.id]?.quadrant ?? normalizeQuadrant(account.quadrant) } }))} tabIndex={flippedAccount === account.id ? 0 : -1} /></label></div>
                        {accountError && flippedAccount === account.id && <p className="account-edit-error" role="status">{accountError}</p>}
                        <div className="account-edit-actions"><button className="account-delete" type="button" onClick={() => setDeleteCandidate(account)} tabIndex={flippedAccount === account.id ? 0 : -1}><span className="material-symbols-outlined" aria-hidden="true">delete</span>删除</button><button className="account-save" type="submit" tabIndex={flippedAccount === account.id ? 0 : -1}>保存</button></div>
                      </form>
                    </div>
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
          {assetFormError && <p className="asset-form-error" role="status">{assetFormError}</p>}
          <div><button type="button" onClick={() => { setFormOpen(false); setAssetFormError(""); }} tabIndex={formOpen ? 0 : -1}>取消</button><button className={created ? "created" : ""} type="submit" disabled={creatingAsset} tabIndex={formOpen ? 0 : -1}>{created ? "添加成功" : creatingAsset ? "添加中…" : "添加"}</button></div>
        </form>
      </section>

      <button className={`fab asset-fab ${formOpen ? "active" : ""}`} type="button" onClick={() => setFormOpen((open) => !open)} aria-label={formOpen ? "关闭添加资产表单" : "添加资产"}><span aria-hidden="true">＋</span></button>
      <div className={`account-delete-dialog ${deleteCandidate ? "open" : ""}`} aria-hidden={!deleteCandidate}>
        <button className="account-delete-backdrop" type="button" onClick={() => setDeleteCandidate(null)} tabIndex={deleteCandidate ? 0 : -1} aria-label="取消删除账户" />
        <section role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <span className="material-symbols-outlined" aria-hidden="true">warning</span><h2 id="delete-account-title">确认删除账户？</h2><p>“{deleteCandidate?.name}”及其当前金额将被永久删除，此操作无法撤销。</p>
          <div><button type="button" onClick={() => setDeleteCandidate(null)} tabIndex={deleteCandidate ? 0 : -1}>取消</button><button type="button" onClick={confirmDeleteAccount} tabIndex={deleteCandidate ? 0 : -1}>确认删除</button></div>
        </section>
      </div>
    </div>
  );
}
