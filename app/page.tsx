"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SiteHeader } from "./components/SiteHeader";

gsap.registerPlugin(useGSAP);

const quickTags = [
  ["餐饮", "餐饮支出"],
  ["交通", "交通结余"],
  ["购物", "购物节省"],
  ["工资", "工资收入"],
] as const;

const WEALTH_PROGRESS = 45;
const WEALTH_PATH = "M-50 450 Q150 420 300 350 T600 250 T1050 100";
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
  const [steadyAllocation, setSteadyAllocation] = useState(60);
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
      rotationX: nextFlipped ? 180 : 0,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.84,
      ease: "back.inOut(1.28)",
      overwrite: "auto",
    });
  });

  const updateAllocation = (account: "steady" | "wealth", value: number) => {
    setSteadyAllocation(account === "steady" ? value : 100 - value);
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

  const submitSavings = (event: FormEvent) => {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaved(true);
    window.setTimeout(() => {
      setModalOpen(false);
      window.setTimeout(() => {
        setAmount("");
        setRemark("");
        setSaved(false);
      }, 450);
    }, 900);
  };

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
                <rect x="0" y="0" width={`${WEALTH_PROGRESS}%`} height="500" />
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
                      keyPoints={`0;${WEALTH_PROGRESS / 100}`}
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
            <p className="altitude home-hero-altitude">当前海拔： <strong>¥450,000</strong> <span>/ 目标： ¥1,000,000</span></p>
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
                  <strong>{WEALTH_PROGRESS}%</strong>
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
            </article>

            <aside className="strategy-card">
              <div ref={strategyInnerRef} className="strategy-card-inner">
                <section className="strategy-card-face strategy-card-front" role="button" tabIndex={strategyFlipped ? -1 : 0} aria-label="打开攀登策略设置" onClick={flipStrategy} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flipStrategy(); } }}>
                  <div className="strategy-title home-strategy-title">
                    <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
                    <h2>攀登策略</h2>
                  </div>
                  <p className="home-strategy-copy">目前的攀登趋势非常稳健。如果每月能额外存入 <strong>¥200</strong>，您的财务顶峰将提早 12 天到达。</p>
                  <span className="strategy-card-action home-strategy-action">点击调整策略 <span className="material-symbols-outlined" aria-hidden="true">flip</span></span>
                </section>

                <section className="strategy-card-face strategy-card-back" aria-hidden={!strategyFlipped}>
                  <div className="strategy-settings-heading">
                    <div><span>资产配置</span><h2>攀登策略设置</h2></div>
                    <button type="button" onClick={flipStrategy} tabIndex={strategyFlipped ? 0 : -1} aria-label="返回攀登策略"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
                  </div>
                  <div className="allocation-control">
                    <div><span>稳健账户</span><strong>{steadyAllocation}%</strong></div>
                    <input type="range" min="0" max="100" value={steadyAllocation} onChange={(event) => updateAllocation("steady", Number(event.target.value))} tabIndex={strategyFlipped ? 0 : -1} aria-label="稳健账户配置比例" />
                  </div>
                  <div className="allocation-control wealth">
                    <div><span>理财账户</span><strong>{100 - steadyAllocation}%</strong></div>
                    <input type="range" min="0" max="100" value={100 - steadyAllocation} onChange={(event) => updateAllocation("wealth", Number(event.target.value))} tabIndex={strategyFlipped ? 0 : -1} aria-label="理财账户配置比例" />
                  </div>
                  <p className="allocation-note"><span className="material-symbols-outlined" aria-hidden="true">sync</span> 两个账户自动保持 100% 配置</p>
                </section>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <button className={`fab ${modalOpen ? "fab-hidden" : ""}`} type="button" onClick={() => setModalOpen(true)} aria-label="添加今日攒钱">
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
                  <h2 id="savings-title">今日攒钱</h2>
                  <p>记录财富的一小步</p>
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
