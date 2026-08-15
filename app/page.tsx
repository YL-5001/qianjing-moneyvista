"use client";

import { type CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SiteHeader } from "./components/SiteHeader";
import { financeRequest, type Account, type FinanceData, type StrategyPlan, type StrategyQuadrant } from "./lib/finance";

gsap.registerPlugin(useGSAP);

const quickTags = [
  ["餐饮", "餐饮支出"],
  ["交通", "交通结余"],
  ["购物", "购物节省"],
  ["工资", "工资收入"],
] as const;

const WEALTH_PATH = "M-50 450 Q150 420 300 350 T600 250 T1050 100";
const STRATEGY_QUADRANTS: Array<{ key: StrategyQuadrant; icon: string }> = [
  { key: "现金账户", icon: "account_balance_wallet" }, { key: "保障账户", icon: "shield" }, { key: "投资账户", icon: "trending_up" }, { key: "养老账户", icon: "elderly" },
];
const DEFAULT_STRATEGY: StrategyPlan = { allocations: { "现金账户": 10, "保障账户": 20, "投资账户": 40, "养老账户": 30 }, accountIds: { "现金账户": null, "保障账户": null, "投资账户": null, "养老账户": null } };
const normalizeQuadrant = (value: string): StrategyQuadrant => {
  if (value === "Q1" || value.includes("现金")) return "现金账户";
  if (value === "Q1/Q2" || value.includes("保障")) return "保障账户";
  if (value === "Q3" || value.includes("投资")) return "投资账户";
  return "养老账户";
};
const ELECTRIC_PARTICLES = [
  { radius: 3.2, duration: 2.8, delay: -0.2 },
  { radius: 1.8, duration: 3.4, delay: -0.7 },
  { radius: 2.4, duration: 2.5, delay: -1.1 },
  { radius: 1.5, duration: 3.1, delay: -1.5 },
  { radius: 2.8, duration: 3.7, delay: -2.0 },
  { radius: 1.7, duration: 2.7, delay: -2.4 },
  { radius: 2.2, duration: 3.3, delay: -2.8 },
  { radius: 1.4, duration: 2.4, delay: -3.2 },
] as const;

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const strategyInnerRef = useRef<HTMLDivElement>(null);
  const strategyFlippedRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [strategyFlipped, setStrategyFlipped] = useState(false);
  const [strategyPlan, setStrategyPlan] = useState<StrategyPlan>(DEFAULT_STRATEGY);
  const strategyPlanRef = useRef<StrategyPlan>(DEFAULT_STRATEGY);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [savingsError, setSavingsError] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdviceError, setAiAdviceError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const { contextSafe } = useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .addLabel("hero", 0)
        .from(".home-hero-title", { y: 34, autoAlpha: 0, duration: 0.82 }, "hero")
        .from(".home-hero-copy", { y: 20, autoAlpha: 0, duration: 0.62 }, "hero+=0.24")
        .from(".home-hero-altitude", { y: 14, autoAlpha: 0, duration: 0.5 }, "hero+=0.42")
        .from(".home-insight-heading, .home-progress-copy", { y: 18, autoAlpha: 0, duration: 0.52, stagger: 0.1 }, "hero+=0.62")
        .from(".home-metric", { y: 18, autoAlpha: 0, scale: 0.975, duration: 0.54, stagger: 0.1 }, "hero+=0.76")
        .from(".home-strategy-title, .home-strategy-copy, .home-strategy-action", { y: 18, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, "hero+=0.86");

      return () => timeline.kill();
    });
    return () => media.revert();
  }, { scope: pageRef });

  const flipStrategy = contextSafe(() => {
    const nextFlipped = !strategyFlippedRef.current;
    strategyFlippedRef.current = nextFlipped;
    setStrategyFlipped(nextFlipped);

    gsap.killTweensOf(strategyInnerRef.current);
    gsap.to(strategyInnerRef.current, {
      rotationY: nextFlipped ? 180 : 0,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.84,
      ease: "back.inOut(1.28)",
      overwrite: "auto",
    });
  });

  const persistStrategy = async (plan: StrategyPlan) => {
    try {
      const data = await financeRequest<FinanceData>({ action: "setStrategyPlan", plan });
      strategyPlanRef.current = data.strategyPlan;
      setStrategyPlan(data.strategyPlan);
      setFinance(data);
    } catch { /* the next successful save restores server state */ }
  };

  const updateAllocation = (quadrant: StrategyQuadrant, requested: number) => {
    const next: StrategyPlan = { allocations: { ...strategyPlan.allocations }, accountIds: { ...strategyPlan.accountIds } };
    const current = next.allocations[quadrant];
    let difference = Math.max(0, Math.min(100, Math.round(requested))) - current;
    const others = STRATEGY_QUADRANTS.map((item) => item.key).filter((key) => key !== quadrant);
    if (difference > 0) {
      for (const other of others) { const taken = Math.min(next.allocations[other], difference); next.allocations[other] -= taken; difference -= taken; }
      next.allocations[quadrant] = Math.max(current, Math.round(requested) - difference);
    } else if (difference < 0) {
      next.allocations[quadrant] = Math.round(requested);
      next.allocations[others[0]] += -difference;
    }
    strategyPlanRef.current = next;
    setStrategyPlan(next);
    return next;
  };

  const updateStrategyAccount = (quadrant: StrategyQuadrant, accountId: string) => {
    const next = { allocations: { ...strategyPlan.allocations }, accountIds: { ...strategyPlan.accountIds, [quadrant]: accountId || null } };
    strategyPlanRef.current = next;
    setStrategyPlan(next); void persistStrategy(next);
  };

  useEffect(() => {
    if (modalOpen) {
      const timer = window.setTimeout(() => amountRef.current?.focus(), 350);
      return () => window.clearTimeout(timer);
    }
  }, [modalOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => { financeRequest().then((data) => { setFinance(data); strategyPlanRef.current = data.strategyPlan ?? DEFAULT_STRATEGY; setStrategyPlan(strategyPlanRef.current); }).catch(() => undefined); }, []);

  const submitSavings = async (event: FormEvent) => {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    try {
      setSavingsError("");
      setFinance(await financeRequest<FinanceData>({ action: "saveSavings", amount: Number(amount), remark }));
      setSaved(true);
      window.setTimeout(() => {
        setModalOpen(false);
        window.setTimeout(() => { setAmount(""); setRemark(""); setSaved(false); }, 450);
      }, 900);
    } catch (cause) { setSaved(false); setSavingsError(cause instanceof Error ? cause.message : "保存失败"); }
  };

  const generateAiAdvice = async () => {
    if (aiAdviceLoading) return;
    try {
      setAiAdviceLoading(true);
      setAiAdviceError("");
      const response = await fetch("/api/advice", { method: "POST" });
      const payload = await response.json() as { advice?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "暂时无法生成建议");
      setAiAdvice(payload.advice ?? "");
    } catch (cause) {
      setAiAdviceError(cause instanceof Error ? cause.message : "暂时无法生成建议");
    } finally {
      setAiAdviceLoading(false);
    }
  };

  const wealthProgress = finance?.summary.progress ?? 45;
  const primaryGoal = finance?.goals[0];
  const accountsForQuadrant = (quadrant: StrategyQuadrant): Account[] => (finance?.accounts ?? []).filter((account) => normalizeQuadrant(account.quadrant) === quadrant);

  return (
    <div ref={pageRef}>
      <SiteHeader active="dashboard" />

      <main id="top" className="dashboard-page">
        <div className="wealth-mountain" aria-hidden="true">
          <svg preserveAspectRatio="none" viewBox="0 0 1000 500">
            <defs>
              <linearGradient id="mountain-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#87ceeb" stopOpacity="0.17" />
                <stop offset="100%" stopColor="#87ceeb" stopOpacity="0" />
              </linearGradient>
              <filter id="mountain-blur">
                <feGaussianBlur stdDeviation="36" />
              </filter>
              <filter id="particle-glow" x="-300%" y="-300%" width="700%" height="700%">
                <feGaussianBlur stdDeviation="2.2" result="particle-blur" />
                <feMerge>
                  <feMergeNode in="particle-blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="wealth-progress-clip">
                <rect x="0" y="0" width={`${wealthProgress}%`} height="500" />
              </clipPath>
            </defs>
            <path id="wealth-curve-path" className="mountain-track" d={WEALTH_PATH} />
            <g clipPath="url(#wealth-progress-clip)">
              <path className="mountain-glow" d={WEALTH_PATH} />
              <path className="mountain-area" d="M-50 500 V450 Q150 420 300 350 T600 250 T1050 100 V500Z" />
              <path className="mountain-line" d={WEALTH_PATH} />
              <path className="mountain-current" d={WEALTH_PATH} />
              <g className="electric-particles" filter="url(#particle-glow)">
                {ELECTRIC_PARTICLES.map((particle, index) => (
                  <circle
                    key={`${particle.duration}-${particle.delay}`}
                    className={index % 3 === 0 ? "electric-particle electric-particle-core" : "electric-particle"}
                    r={particle.radius}
                  >
                    <animateMotion
                      dur={`${particle.duration}s`}
                      begin={`${particle.delay}s`}
                      repeatCount="indefinite"
                      keyPoints={`0;${wealthProgress / 100}`}
                      keyTimes="0;1"
                      calcMode="linear"
                    >
                      <mpath href="#wealth-curve-path" />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            </g>
          </svg>
        </div>

        <div className="page-shell">
          <section className="hero" aria-labelledby="hero-title">
            <h1 id="hero-title" className="home-hero-title">攀登财富之巅</h1>
            <p className="home-hero-copy">每一次储蓄都是在向您的财务巅峰迈进一步。</p>
            <p className="altitude home-hero-altitude">当前海拔： <strong>¥{new Intl.NumberFormat("zh-CN").format(primaryGoal?.current ?? 450000)}</strong> <span>/ 目标： ¥{new Intl.NumberFormat("zh-CN").format(primaryGoal?.target ?? 1000000)}</span></p>
          </section>

          <section id="dashboard" className="dashboard-grid" aria-label="财富仪表盘">
            <article className="insight-card glass-card">
                <div className="card-heading">
                  <div className="heading-title home-insight-heading">
                    <span className="metric-icon material-symbols-outlined" aria-hidden="true">monitoring</span>
                    <h2>增长洞察</h2>
                  </div>
                  <div className="progress-copy home-progress-copy">
                    <span>进度</span>
                    <strong>{wealthProgress}%</strong>
                  </div>
                </div>

                <div className="metrics">
                  <div className="metric-tile home-metric">
                    <span className="metric-label">本月结余</span>
                    <strong>+¥12,400</strong>
                    <span className="metric-detail positive"><span aria-hidden="true">↗</span> 12% 同比</span>
                  </div>
                  <div className="metric-tile home-metric">
                    <span className="metric-label">投资收益</span>
                    <strong>¥4,820</strong>
                    <span className="metric-detail blue">年化 8.4%</span>
                  </div>
                  <div className="metric-tile home-metric">
                    <span className="metric-label">预计登顶</span>
                    <strong>14个月</strong>
                    <span className="metric-detail">按当前速度</span>
                  </div>
                </div>
              <section className="home-ai-advice" aria-live="polite" aria-label="增长洞察 AI 陪伴规划">
                <div className="home-ai-advice-heading"><span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span><div><span>AI 陪伴规划</span><h2>下一步，向目标靠近</h2></div></div>
                <p>{aiAdvice || "结合您的资产配置、储蓄记录与财富目标，生成一条专属的下一步行动建议。"}</p>
                {aiAdviceError && <p className="home-ai-advice-error" role="status">{aiAdviceError}</p>}
                <div className="home-ai-advice-footer"><button type="button" onClick={generateAiAdvice} disabled={aiAdviceLoading}>{aiAdviceLoading ? "正在规划…" : aiAdvice ? "更新建议" : "生成我的建议"}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button><small>生成时会向智谱发送汇总资产与目标数据</small></div>
              </section>
            </article>

            <aside className="strategy-card">
              <div ref={strategyInnerRef} className="strategy-card-inner">
                <section className="strategy-card-face strategy-card-front" role="button" tabIndex={strategyFlipped ? -1 : 0} aria-label="打开攀登策略设置" onClick={flipStrategy} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flipStrategy(); } }}>
                  <div className="strategy-title home-strategy-title">
                    <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
                    <h2>攀登策略</h2>
                  </div>
                  <p className="home-strategy-copy">将每月攒钱按四类账户自动分配。配置完成后，每一笔存入都会精准进入您选定的账户。</p>
                  <span className="strategy-card-action home-strategy-action">点击调整策略 <span className="material-symbols-outlined" aria-hidden="true">flip</span></span>
                </section>

                <section className="strategy-card-face strategy-card-back" aria-hidden={!strategyFlipped}>
                  <div className="strategy-settings-heading">
                    <div><span>资产配置</span><h2>攀登策略设置</h2></div>
                    <button type="button" onClick={flipStrategy} tabIndex={strategyFlipped ? 0 : -1} aria-label="返回攀登策略"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
                  </div>
                  <div className="strategy-allocation-list">
                    {STRATEGY_QUADRANTS.map(({ key, icon }) => {
                      const options = accountsForQuadrant(key);
                      return <div className="allocation-control strategy-quadrant" key={key}>
                        <div><span><i className="material-symbols-outlined" aria-hidden="true">{icon}</i>{key}</span><strong>{strategyPlan.allocations[key]}%</strong></div>
                        {options.length > 1 ? <select value={strategyPlan.accountIds[key] ?? ""} onChange={(event) => updateStrategyAccount(key, event.target.value)} tabIndex={strategyFlipped ? 0 : -1} aria-label={`${key}入账账户`}><option value="">选择入账账户</option>{options.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select> : options.length === 1 ? <p className="strategy-account-fixed"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span> 自动存入 {options[0].name}</p> : <p className="strategy-account-empty"><span className="material-symbols-outlined" aria-hidden="true">info</span> 请先在资产页添加此类账户</p>}
                        <input className="allocation-range" style={{ "--allocation": `${strategyPlan.allocations[key]}%` } as CSSProperties} type="range" min="0" max="100" value={strategyPlan.allocations[key]} onChange={(event) => updateAllocation(key, Number(event.target.value))} onPointerUp={() => void persistStrategy(strategyPlanRef.current)} onKeyUp={() => void persistStrategy(strategyPlanRef.current)} tabIndex={strategyFlipped ? 0 : -1} aria-label={`${key}配置比例`} />
                      </div>;
                    })}
                  </div>
                  <p className="allocation-note"><span className="material-symbols-outlined" aria-hidden="true">sync</span> 四类账户自动保持 100% 配置</p>
                </section>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <button className={`fab ${modalOpen ? "fab-hidden" : ""}`} type="button" onClick={() => setModalOpen(true)} aria-label="添加本月攒钱">
        <span aria-hidden="true">＋</span>
      </button>

      <div className={`modal-layer ${modalOpen ? "open" : ""}`} aria-hidden={!modalOpen}>
        <button className="modal-backdrop" type="button" onClick={() => setModalOpen(false)} aria-label="关闭弹窗" tabIndex={modalOpen ? 0 : -1} />
        <section className="savings-modal" role="dialog" aria-modal="true" aria-labelledby="savings-title">
          <div className="modal-handle" />
          <form onSubmit={submitSavings}>
            <div className="modal-heading">
              <div className="modal-heading-copy">
                <span className="savings-icon material-symbols-outlined" aria-hidden="true">savings</span>
                <div>
                  <h2 id="savings-title">本月攒钱</h2>
                  <p>每一小步，都会离巅峰更近</p>
                </div>
              </div>
              <button className="modal-close material-symbols-outlined" type="button" onClick={() => setModalOpen(false)} aria-label="关闭">close</button>
            </div>

            <label className="field-label" htmlFor="savings-amount">金额 (CNY)</label>
            <div className="amount-field">
              <span>¥</span>
              <input ref={amountRef} id="savings-amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} tabIndex={modalOpen ? 0 : -1} />
            </div>

            <label className="field-label" htmlFor="savings-remark">备注</label>
            <input className="remark-field" id="savings-remark" type="text" placeholder="记录这笔钱的来源..." value={remark} onChange={(event) => setRemark(event.target.value)} tabIndex={modalOpen ? 0 : -1} />
            <p className="savings-distribution">将按攀登策略分配至已选账户</p>
            {savingsError && <p className="savings-error" role="status">{savingsError}</p>}

            <span className="field-label tag-label">常用标签</span>
            <div className="quick-tags">
              {quickTags.map(([label, value]) => (
                <button key={label} type="button" onClick={() => setRemark(value)} tabIndex={modalOpen ? 0 : -1}>{label}</button>
              ))}
            </div>

            <button className={`save-button ${saved ? "saved" : ""}`} type="submit" tabIndex={modalOpen ? 0 : -1}>
              {saved ? "存入成功！" : "确认存入"}
              <span className="material-symbols-outlined" aria-hidden="true">{saved ? "done" : "check_circle"}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
