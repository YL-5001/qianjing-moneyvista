"use client";

import { FormEvent, useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

const goals = [
  {
    title: "买房基金",
    subtitle: "首套住房置业计划",
    icon: "paid",
    status: "进行中",
    current: "¥ 650,000",
    target: "¥ 1,000,000",
    progress: 65,
    estimate: "18个月",
    path: "M0 52 Q48 48 96 28 T200 8",
    markerX: 130,
    markerY: 21,
    markerLabel: true,
  },
  {
    title: "环球旅行",
    subtitle: "极光与热带雨林探索",
    icon: "public",
    status: "加速中",
    current: "¥ 164,000",
    target: "¥ 200,000",
    progress: 82,
    estimate: "4个月",
    path: "M0 55 Q42 50 82 45 T160 15",
    markerX: 160,
    markerY: 15,
  },
  {
    title: "退休储备",
    subtitle: "悦享晚年生活保障",
    icon: "account_balance_wallet",
    status: "长跑中",
    current: "¥ 480,000",
    target: "¥ 5,000,000",
    progress: 12,
    estimate: "20年",
    path: "M0 55 L50 52 L100 48 L150 45 L200 42",
    markerX: 60,
    markerY: 51,
    muted: true,
  },
] as const;

const completedGoals = [
  { title: "首台汽车购置计划", date: "2023年10月", amount: "¥ 350,000" },
  { title: "应急备用金", date: "2023年02月", amount: "¥ 100,000" },
] as const;

export default function GoalsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFormOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const createGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setCreated(true);
    window.setTimeout(() => {
      setFormOpen(false);
      setCreated(false);
      form.reset();
    }, 850);
  };

  return (
    <>
      <SiteHeader active="goals" />

      <main className="goals-page">
        <div className="goal-ambient goal-ambient-top" aria-hidden="true" />
        <div className="goal-ambient goal-ambient-bottom" aria-hidden="true" />

        <div className="goals-shell">
          <header className="goals-hero">
            <span className="goals-kicker">财富巅峰计划</span>
            <h1>我的财富巅峰</h1>
            <p>每一次储蓄都是向上的攀登。在这里，我们将复杂的财务规划转化为清晰的登顶路径，助您稳步抵达梦想的高度。</p>
          </header>

          <section className="goal-card-grid" aria-label="进行中的财富目标">
            {goals.map((goal, index) => (
              <article className="goal-card" key={goal.title} style={{ animationDelay: `${index * 0.1 + 0.08}s` }}>
                <div className="goal-card-topline">
                  <span className="goal-icon material-symbols-outlined" aria-hidden="true">{goal.icon}</span>
                  <span className={`goal-status ${goal.muted ? "muted" : ""}`}>{goal.status}</span>
                </div>

                <h2>{goal.title}</h2>
                <p className="goal-subtitle">{goal.subtitle}</p>

                <div className="goal-curve" aria-hidden="true">
                  <svg viewBox="0 0 200 65" preserveAspectRatio="none">
                    <path className="goal-climb-path" d={goal.path} pathLength="200" />
                    {goal.markerLabel && <text x={goal.markerX} y={goal.markerY - 10}>当前位置</text>}
                    <circle cx={goal.markerX} cy={goal.markerY} r="4" />
                  </svg>
                </div>

                <div className="goal-values">
                  <div>
                    <span>当前累积</span>
                    <strong>{goal.current}</strong>
                  </div>
                  <div className="goal-target">
                    <span>目标值</span>
                    <strong>{goal.target}</strong>
                  </div>
                </div>

                <div className="goal-progress" aria-label={`${goal.title}进度 ${goal.progress}%`}>
                  <span style={{ width: `${goal.progress}%` }} />
                </div>
                <div className="goal-progress-copy">
                  <strong>{goal.progress}% 已攀登</strong>
                  <span>预计登顶: {goal.estimate}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="completed-goals" aria-labelledby="completed-title">
            <div className="completed-heading">
              <h2 id="completed-title">已达巅峰</h2>
              <span aria-hidden="true" />
            </div>
            <div className="completed-grid">
              {completedGoals.map((goal) => (
                <article className="completed-card" key={goal.title}>
                  <span className="completed-icon material-symbols-outlined" aria-hidden="true">check_circle</span>
                  <div>
                    <h3>{goal.title}</h3>
                    <p>达成日期: {goal.date}</p>
                  </div>
                  <strong>{goal.amount}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <section className={`new-goal-popover ${formOpen ? "open" : ""}`} aria-hidden={!formOpen}>
        <h2>设定新目标</h2>
        <form onSubmit={createGoal}>
          <label htmlFor="goal-name">目标名称</label>
          <input id="goal-name" name="goal-name" placeholder="例如：购车基金" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="goal-target">目标金额 (¥)</label>
          <input id="goal-target" name="goal-target" type="number" min="1" placeholder="0.00" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="goal-initial">初始金额 (¥)</label>
          <input id="goal-initial" name="goal-initial" type="number" min="0" placeholder="0.00" tabIndex={formOpen ? 0 : -1} />
          <div className="new-goal-actions">
            <button type="button" onClick={() => setFormOpen(false)} tabIndex={formOpen ? 0 : -1}>取消</button>
            <button className={created ? "created" : ""} type="submit" tabIndex={formOpen ? 0 : -1}>{created ? "创建成功" : "创建"}</button>
          </div>
        </form>
      </section>

      <button className={`fab goal-fab ${formOpen ? "active" : ""}`} type="button" onClick={() => setFormOpen((open) => !open)} aria-label={formOpen ? "关闭新目标表单" : "设定新目标"}>
        <span aria-hidden="true">＋</span>
        <span className="goal-fab-label">设定新目标</span>
      </button>
    </>
  );
}
