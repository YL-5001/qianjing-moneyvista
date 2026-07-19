"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

type GoalData = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: string;
  current: number;
  target: number;
  estimate: string;
  path: string;
  muted?: boolean;
};

const INITIAL_GOALS: GoalData[] = [
  { id: "house", title: "买房基金", subtitle: "首套住房置业计划", icon: "paid", status: "进行中", current: 650000, target: 1000000, estimate: "18个月", path: "M0 52 Q48 48 96 28 T200 8" },
  { id: "travel", title: "环球旅行", subtitle: "极光与热带雨林探索", icon: "public", status: "加速中", current: 164000, target: 200000, estimate: "4个月", path: "M0 55 Q42 50 82 45 T160 15 T200 5" },
  { id: "retirement", title: "退休储备", subtitle: "悦享晚年生活保障", icon: "account_balance_wallet", status: "长跑中", current: 480000, target: 5000000, estimate: "20年", path: "M0 55 L50 52 L100 48 L150 45 L200 42", muted: true },
];

const completedGoals = [
  { title: "首台汽车购置计划", date: "2023年10月", amount: "¥ 350,000" },
  { title: "应急备用金", date: "2023年02月", amount: "¥ 100,000" },
] as const;

const formatCurrency = (value: number) => `¥ ${new Intl.NumberFormat("zh-CN").format(value)}`;
const getProgress = (goal: GoalData) => Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));

export default function GoalsPage() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [flippedGoal, setFlippedGoal] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setFlippedGoal(null);
        setFormOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const flipWithKeyboard = (event: KeyboardEvent<HTMLElement>, goalId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setFlippedGoal(goalId);
    }
  };

  const updateGoal = (goalId: string, updates: Partial<Pick<GoalData, "title" | "target">>) => {
    setGoals((currentGoals) => currentGoals.map((goal) => goal.id === goalId ? { ...goal, ...updates } : goal));
  };

  const adjustCurrent = (goalId: string, direction: 1 | -1) => {
    const amount = Number(adjustments[goalId]);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback((current) => ({ ...current, [goalId]: "请输入有效金额" }));
      return;
    }

    setGoals((currentGoals) => currentGoals.map((goal) => goal.id === goalId
      ? { ...goal, current: Math.max(0, goal.current + amount * direction) }
      : goal));
    setAdjustments((current) => ({ ...current, [goalId]: "" }));
    setFeedback((current) => ({
      ...current,
      [goalId]: `${direction === 1 ? "已增加" : "已减少"} ${formatCurrency(amount)}`,
    }));
    window.setTimeout(() => setFeedback((current) => ({ ...current, [goalId]: "" })), 1800);
  };

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
            {goals.map((goal, index) => {
              const progress = getProgress(goal);
              const isFlipped = flippedGoal === goal.id;
              const pathId = `goal-path-${goal.id}`;

              return (
                <article className={`goal-card-shell ${isFlipped ? "flipped" : ""}`} key={goal.id} style={{ animationDelay: `${index * 0.1 + 0.08}s` }}>
                  <div className="goal-card-inner">
                    <section
                      className="goal-card-face goal-card-front"
                      role="button"
                      tabIndex={isFlipped ? -1 : 0}
                      aria-label={`编辑${goal.title}`}
                      aria-pressed={isFlipped}
                      onClick={() => setFlippedGoal(goal.id)}
                      onKeyDown={(event) => flipWithKeyboard(event, goal.id)}
                    >
                      <div className="goal-card-topline">
                        <span className="goal-icon material-symbols-outlined" aria-hidden="true">{goal.icon}</span>
                        <span className={`goal-status ${goal.muted ? "muted" : ""}`}>{goal.status}</span>
                      </div>
                      <h2>{goal.title}</h2>
                      <p className="goal-subtitle">{goal.subtitle}</p>

                      <div className="goal-curve" aria-hidden="true">
                        <svg viewBox="0 0 200 65" preserveAspectRatio="none">
                          <path id={pathId} className="goal-climb-path" d={goal.path} pathLength="200" />
                          <circle key={`${goal.id}-${progress}`} r="4">
                            <animateMotion dur=".55s" fill="freeze" keyPoints={`0;${progress / 100}`} keyTimes="0;1" calcMode="linear">
                              <mpath href={`#${pathId}`} />
                            </animateMotion>
                          </circle>
                        </svg>
                      </div>

                      <div className="goal-values">
                        <div><span>当前累积</span><strong>{formatCurrency(goal.current)}</strong></div>
                        <div className="goal-target"><span>目标值</span><strong>{formatCurrency(goal.target)}</strong></div>
                      </div>
                      <div className="goal-progress" aria-label={`${goal.title}进度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
                      <div className="goal-progress-copy"><strong>{progress}% 已攀登</strong><span>预计登顶: {goal.estimate}</span></div>
                      <span className="goal-edit-hint"><span className="material-symbols-outlined" aria-hidden="true">touch_app</span> 点击编辑</span>
                    </section>

                    <section className="goal-card-face goal-card-back" aria-hidden={!isFlipped}>
                      <div className="goal-back-heading">
                        <div><span>编辑财富目标</span><h2>{goal.title}</h2></div>
                        <button type="button" onClick={() => setFlippedGoal(null)} tabIndex={isFlipped ? 0 : -1} aria-label={`关闭${goal.title}编辑`}>
                          <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                      </div>

                      <label htmlFor={`title-${goal.id}`}>目标名称</label>
                      <input id={`title-${goal.id}`} value={goal.title} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} tabIndex={isFlipped ? 0 : -1} />
                      <label htmlFor={`target-${goal.id}`}>目标值 (¥)</label>
                      <input id={`target-${goal.id}`} type="number" min="1" value={goal.target} onChange={(event) => updateGoal(goal.id, { target: Math.max(1, Number(event.target.value)) })} tabIndex={isFlipped ? 0 : -1} />

                      <div className="goal-back-summary">
                        <div><span>当前累计</span><strong>{formatCurrency(goal.current)}</strong></div>
                        <div><span>完成进度</span><strong>{progress}%</strong></div>
                      </div>

                      <div className="goal-adjust-panel">
                        <label htmlFor={`adjust-${goal.id}`}>调整当前累计金额</label>
                        <div className="goal-adjust-row">
                          <span>¥</span>
                          <input
                            id={`adjust-${goal.id}`}
                            type="number"
                            min="0"
                            step="100"
                            placeholder="输入金额"
                            value={adjustments[goal.id] ?? ""}
                            onChange={(event) => setAdjustments((current) => ({ ...current, [goal.id]: event.target.value }))}
                            tabIndex={isFlipped ? 0 : -1}
                          />
                          <button className="subtract" type="button" onClick={() => adjustCurrent(goal.id, -1)} tabIndex={isFlipped ? 0 : -1} aria-label="从当前累计值中减去">−</button>
                          <button className="add" type="button" onClick={() => adjustCurrent(goal.id, 1)} tabIndex={isFlipped ? 0 : -1} aria-label="加到当前累计值上">＋</button>
                        </div>
                        <p className={feedback[goal.id] ? "visible" : ""} role="status">{feedback[goal.id] || "输入金额后选择增加或减少"}</p>
                      </div>
                    </section>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="completed-goals" aria-labelledby="completed-title">
            <div className="completed-heading"><h2 id="completed-title">已达巅峰</h2><span aria-hidden="true" /></div>
            <div className="completed-grid">
              {completedGoals.map((goal) => (
                <article className="completed-card" key={goal.title}>
                  <span className="completed-icon material-symbols-outlined" aria-hidden="true">check_circle</span>
                  <div><h3>{goal.title}</h3><p>达成日期: {goal.date}</p></div>
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
          <label htmlFor="goal-name">目标名称</label><input id="goal-name" name="goal-name" placeholder="例如：购车基金" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="goal-target-new">目标金额 (¥)</label><input id="goal-target-new" name="goal-target" type="number" min="1" placeholder="0.00" required tabIndex={formOpen ? 0 : -1} />
          <label htmlFor="goal-initial">初始金额 (¥)</label><input id="goal-initial" name="goal-initial" type="number" min="0" placeholder="0.00" tabIndex={formOpen ? 0 : -1} />
          <div className="new-goal-actions"><button type="button" onClick={() => setFormOpen(false)} tabIndex={formOpen ? 0 : -1}>取消</button><button className={created ? "created" : ""} type="submit" tabIndex={formOpen ? 0 : -1}>{created ? "创建成功" : "创建"}</button></div>
        </form>
      </section>

      <button className={`fab goal-fab ${formOpen ? "active" : ""}`} type="button" onClick={() => setFormOpen((open) => !open)} aria-label={formOpen ? "关闭新目标表单" : "设定新目标"}>
        <span aria-hidden="true">＋</span><span className="goal-fab-label">设定新目标</span>
      </button>
    </>
  );
}
