"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const quickTags = [
  ["餐饮", "餐饮支出"],
  ["交通", "交通结余"],
  ["购物", "购物节省"],
  ["工资", "工资收入"],
] as const;

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

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
    <>
      <header className="topbar">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="钱景首页">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-chart">↗</span>
              <span className="brand-mini">MoneyVista</span>
            </span>
            <span className="brand-name">钱景</span>
          </a>

          <nav className="desktop-nav" aria-label="主要导航">
            <a className="active" href="#dashboard">仪表盘</a>
            <a href="#assets">资产</a>
            <a href="#goals">目标</a>
            <a href="#reports">报告</a>
          </nav>

          <button className="icon-button notification" type="button" aria-label="通知">
            <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
          </button>
        </div>
      </header>

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
            </defs>
            <path className="mountain-glow" d="M-50 450 Q150 420 300 350 T600 250 T1050 100" />
            <path className="mountain-area" d="M-50 500 V450 Q150 420 300 350 T600 250 T1050 100 V500Z" />
            <path className="mountain-line" d="M-50 450 Q150 420 300 350 T600 250 T1050 100" />
          </svg>
        </div>

        <div className="page-shell">
          <section className="hero" aria-labelledby="hero-title">
            <h1 id="hero-title">攀登财富之巅</h1>
            <p>每一次储蓄都是在向您的财务巅峰迈进一步。</p>
            <p className="altitude">当前海拔： <strong>¥450,000</strong> <span>/ 目标： ¥1,000,000</span></p>
          </section>

          <section id="dashboard" className="dashboard-grid" aria-label="财富仪表盘">
            <article className="insight-card glass-card">
              <div className="card-heading">
                <div className="heading-title">
                  <span className="metric-icon material-symbols-outlined" aria-hidden="true">monitoring</span>
                  <h2>增长洞察</h2>
                </div>
                <div className="progress-copy">
                  <span>进度</span>
                  <strong>45%</strong>
                </div>
              </div>

              <div className="metrics">
                <div className="metric-tile">
                  <span className="metric-label">本月结余</span>
                  <strong>+¥12,400</strong>
                  <span className="metric-detail positive"><span aria-hidden="true">↗</span> 12% 同比</span>
                </div>
                <div className="metric-tile">
                  <span className="metric-label">投资收益</span>
                  <strong>¥4,820</strong>
                  <span className="metric-detail blue">年化 8.4%</span>
                </div>
                <div className="metric-tile">
                  <span className="metric-label">预计登顶</span>
                  <strong>14个月</strong>
                  <span className="metric-detail">按当前速度</span>
                </div>
              </div>
            </article>

            <aside className="strategy-card">
              <div className="strategy-title">
                <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
                <h2>攀登策略</h2>
              </div>
              <p>目前的攀登趋势非常稳健。如果每月能额外存入 <strong>¥200</strong>，您的财务顶峰将提早 12 天到达。</p>
              <button type="button">查看详细报告</button>
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
    </>
  );
}
