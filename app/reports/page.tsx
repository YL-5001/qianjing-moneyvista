"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { financeRequest, type FinanceData } from "../lib/finance";

const distribution = [
  { label: "投资", value: 65, color: "#78c8e8" },
  { label: "储蓄", value: 25, color: "#b9e6f7" },
  { label: "现金", value: 10, color: "#e1f3fa" },
] as const;

const monthLabels = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"] as const;

export default function ReportsPage() {
  const [range, setRange] = useState<"year" | "all">("year");
  const [formOpen, setFormOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormOpen(false);
        setPlanOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => { financeRequest().then(setFinance).catch(() => undefined); }, []);

  const createReport = () => {
    setGenerated(true);
    window.setTimeout(() => {
      setFormOpen(false);
      setGenerated(false);
    }, 900);
  };

  const generateAdvice = async () => {
    if (adviceLoading) return;
    try {
      setAdviceLoading(true);
      setAdviceError("");
      const response = await fetch("/api/advice", { method: "POST" });
      const payload = await response.json() as { advice?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "暂时无法生成建议");
      setAdvice(payload.advice ?? "");
      setPlanOpen(true);
    } catch (cause) {
      setAdviceError(cause instanceof Error ? cause.message : "暂时无法生成建议");
    } finally {
      setAdviceLoading(false);
    }
  };

  const trendPath = range === "year"
    ? "M0 80 C105 72 185 88 285 61 C382 34 472 48 575 22 C675 -4 770 16 868 10 C916 7 960 3 1000 0 L1000 100 L0 100 Z"
    : "M0 84 C95 78 165 66 252 70 C335 74 420 48 505 52 C590 56 665 31 748 25 C840 18 910 21 1000 4 L1000 100 L0 100 Z";
  const totalAssets = finance?.summary.totalAssets ?? 2400000;
  const monthlySavings = finance?.goals.flatMap((goal) => goal.records).filter((record) => record.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, record) => sum + record.amount, 0) ?? 30350;

  return (
    <>
      <SiteHeader active="reports" />

      <main className="reports-page">
        <div className="reports-shell">
          <header className="reports-hero">
            <div>
              <span className="reports-kicker">ANNUAL INSIGHT</span>
              <h1>财富洞察报告</h1>
              <p>在过去的一年中，您的资产净值稳健攀升。通过精细化的资产配置与支出的深度优化，您距离终点线又近了一步。</p>
            </div>
            <aside className="growth-rate"><span>同期增长率</span><div><strong>+12.4</strong><b>%</b></div></aside>
          </header>

          <section className="reports-grid" aria-label="年度财富报告">
            <article className="report-card trend-report">
              <div className="report-card-heading">
                <h2>增长趋势</h2>
                <div className="report-range" aria-label="趋势时间范围">
                  <button className={range === "year" ? "active" : ""} type="button" onClick={() => setRange("year")}>12个月</button>
                  <button className={range === "all" ? "active" : ""} type="button" onClick={() => setRange("all")}>全部</button>
                </div>
              </div>
              <div className="wealth-trend-chart" role="img" aria-label={range === "year" ? "过去12个月资产总体增长趋势" : "全部时间资产总体增长趋势"}>
                <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
                  <defs><linearGradient id="report-mountain-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#87ceeb" stopOpacity=".42" /><stop offset="100%" stopColor="#87ceeb" stopOpacity="0" /></linearGradient></defs>
                  <path key={range} d={trendPath} />
                </svg>
                <div className="trend-months">{monthLabels.map((month) => <span key={month}>{month}</span>)}</div>
              </div>
            </article>

            <article className="report-card distribution-report">
              <h2>资产分布</h2>
              <div className="distribution-ring"><div><strong>¥{(totalAssets / 1_000_000).toFixed(1)}M</strong><span>总资产</span></div></div>
              <div className="distribution-legend">
                {distribution.map((item) => <div key={item.label}><span className="legend-label"><i style={{ background: item.color }} />{item.label}</span><strong>{item.value}%</strong></div>)}
              </div>
            </article>

            <article className="report-card report-stat">
              <span>本月收入</span><strong>¥42,800.00</strong>
              <div className="stat-bars income-bars" aria-label="本月收入变化柱状图"><i /><i /><i /><i /><i /></div>
            </article>

            <article className="report-card report-stat">
              <span>净储蓄额</span><strong>¥{new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2 }).format(monthlySavings)}</strong>
              <div className="stat-bars savings-bars" aria-label="净储蓄额变化柱状图"><i /><i /><i /><i /><i /></div>
            </article>

            <article className={`report-advice ${planOpen ? "expanded" : ""}`}>
              <span className="advice-icon material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              <div>
                <h2>攀登建议：AI 深度优化</h2>
                <p>{advice || "基于您近三个月的消费模式，我们发现您的“非必要生活开支”占比有所上升。如果将这部分资金的 30% 转移至“全球指数基金”，按照 7% 的预期年化收益率，您将提前 14 个月达成“退休金储备”目标。"}</p>
                {adviceError && <p className="advice-error" role="status">{adviceError}</p>}
                {planOpen && <div className="advice-plan"><span>建议每月转入</span><strong>¥3,720</strong><span>预计新增长期收益</span><strong>¥186,400</strong></div>}
                <div className="advice-actions">
                  <button type="button" onClick={generateAdvice} disabled={adviceLoading}>{adviceLoading ? "GLM 正在分析…" : "使用 GLM 生成建议"}<span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span></button>
                  <button type="button" onClick={() => setPlanOpen((open) => !open)}>{planOpen ? "收起优化方案" : "查看优化方案"}<span className="material-symbols-outlined" aria-hidden="true">{planOpen ? "arrow_upward" : "arrow_forward"}</span></button>
                </div>
                <small className="advice-disclosure">生成时会向智谱发送本页汇总的资产与目标数据。</small>
              </div>
            </article>
          </section>
        </div>
      </main>

      <section className={`new-report-popover ${formOpen ? "open" : ""}`} aria-hidden={!formOpen}>
        <h2>生成财富报告</h2>
        <p>选择报告周期，我们会汇总资产表现、储蓄效率与目标进度。</p>
        <label htmlFor="report-period">报告周期</label>
        <select id="report-period" tabIndex={formOpen ? 0 : -1}><option>过去 12 个月</option><option>过去 6 个月</option><option>全部时间</option></select>
        <div><button type="button" onClick={() => setFormOpen(false)} tabIndex={formOpen ? 0 : -1}>取消</button><button className={generated ? "generated" : ""} type="button" onClick={createReport} tabIndex={formOpen ? 0 : -1}>{generated ? "生成成功" : "生成"}</button></div>
      </section>

      <button className={`fab report-fab ${formOpen ? "active" : ""}`} type="button" onClick={() => setFormOpen((open) => !open)} aria-label={formOpen ? "关闭报告生成面板" : "生成新报告"}><span aria-hidden="true">＋</span></button>
    </>
  );
}
