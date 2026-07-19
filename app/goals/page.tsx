"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
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
  records: GoalRecord[];
  muted?: boolean;
};

type GoalRecord = {
  id: string;
  date: string;
  amount: number;
  note: string;
  balance: number;
};

const INITIAL_GOALS: GoalData[] = [
  { id: "house", title: "买房基金", subtitle: "首套住房置业计划", icon: "paid", status: "进行中", current: 650000, target: 1000000, estimate: "18个月", records: [
    { id: "house-3", date: "2026-07-19", amount: 5000, note: "工资结余", balance: 650000 },
    { id: "house-2", date: "2026-06-28", amount: 2000, note: "月度储蓄", balance: 645000 },
    { id: "house-1", date: "2026-06-12", amount: 3000, note: "投资收益", balance: 643000 },
  ] },
  { id: "travel", title: "环球旅行", subtitle: "极光与热带雨林探索", icon: "public", status: "加速中", current: 164000, target: 200000, estimate: "4个月", records: [
    { id: "travel-3", date: "2026-07-10", amount: 8000, note: "旅行专项储蓄", balance: 164000 },
    { id: "travel-2", date: "2026-06-16", amount: 4500, note: "项目奖金", balance: 156000 },
    { id: "travel-1", date: "2026-05-30", amount: 3000, note: "月度储蓄", balance: 151500 },
  ] },
  { id: "retirement", title: "退休储备", subtitle: "悦享晚年生活保障", icon: "account_balance_wallet", status: "长跑中", current: 480000, target: 5000000, estimate: "20年", muted: true, records: [
    { id: "retirement-3", date: "2026-07-01", amount: 6000, note: "定期投入", balance: 480000 },
    { id: "retirement-2", date: "2026-06-01", amount: 6000, note: "定期投入", balance: 474000 },
    { id: "retirement-1", date: "2026-05-01", amount: 6000, note: "定期投入", balance: 468000 },
  ] },
];

const completedGoals = [
  { title: "首台汽车购置计划", date: "2023年10月", amount: "¥ 350,000" },
  { title: "应急备用金", date: "2023年02月", amount: "¥ 100,000" },
] as const;

const formatCurrency = (value: number) => `¥ ${new Intl.NumberFormat("zh-CN").format(value)}`;
const formatCompactCurrency = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 10000) {
    const tenThousands = absolute / 10000;
    return `¥ ${tenThousands.toLocaleString("zh-CN", { maximumFractionDigits: tenThousands >= 10 ? 0 : 1 })}万`;
  }
  return formatCurrency(absolute);
};
const formatRecordDate = (value: string) => new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date(`${value}T12:00:00`));
const getProgress = (goal: GoalData) => Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
const getGoalTrend = (goal: GoalData) => {
  const day = 86_400_000;
  const chronological = [...goal.records].reverse().sort((a, b) => a.date.localeCompare(b.date));
  const daily = chronological.reduce<Array<{ date: string; balance: number; change: number }>>((result, record) => {
    const previous = result[result.length - 1];
    if (previous?.date === record.date) {
      previous.balance = record.balance;
      previous.change += record.amount;
    } else {
      result.push({ date: record.date, balance: record.balance, change: record.amount });
    }
    return result;
  }, []);

  if (daily.length < 2) {
    const balance = daily[0]?.balance ?? goal.current;
    return {
      path: "M6 34 L194 34",
      areaPath: "M6 34 L194 34 L194 62 L6 62 Z",
      points: [{ x: 194, y: 34 }],
      days: 0,
      delta: 0,
      start: balance,
      end: balance,
      hasTrend: false,
    };
  }

  const samples = daily.map((item) => ({ time: new Date(`${item.date}T12:00:00`).getTime(), balance: item.balance }));
  const firstTime = samples[0].time;
  const lastTime = samples[samples.length - 1].time;
  const balances = samples.map((sample) => sample.balance);
  const minimum = Math.min(...balances);
  const maximum = Math.max(...balances);
  const range = Math.max(1, maximum - minimum);
  const points = samples.map((sample) => ({
    x: 6 + ((sample.time - firstTime) / Math.max(day, lastTime - firstTime)) * 188,
    y: 58 - ((sample.balance - minimum) / range) * 48,
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");

  return {
    path,
    areaPath: `${path} L${points[points.length - 1].x.toFixed(2)} 62 L${points[0].x.toFixed(2)} 62 Z`,
    points,
    days: Math.max(1, Math.round((lastTime - firstTime) / day)),
    delta: balances[balances.length - 1] - balances[0],
    start: balances[0],
    end: balances[balances.length - 1],
    hasTrend: true,
  };
};
const matchGoalIcon = (title: string) => {
  const rules: Array<[RegExp, string]> = [
    [/(房|住宅|公寓|装修|置业)/, "home"],
    [/(车|汽车|摩托|交通)/, "directions_car"],
    [/(旅行|旅游|环球|度假|出国)/, "public"],
    [/(教育|学习|学校|留学|课程)/, "school"],
    [/(医疗|健康|看病|手术|保险)/, "health_and_safety"],
    [/(退休|养老|晚年)/, "account_balance_wallet"],
    [/(创业|事业|公司|生意)/, "rocket_launch"],
    [/(婚礼|结婚|婚姻)/, "favorite"],
    [/(电脑|手机|数码|设备)/, "devices"],
    [/(应急|备用|储备)/, "savings"],
  ];
  return rules.find(([pattern]) => pattern.test(title))?.[1] ?? "flag";
};

export default function GoalsPage() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [flippedGoal, setFlippedGoal] = useState<string | null>(null);
  const [historyGoal, setHistoryGoal] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const goalListRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setHistoryGoal(null);
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
    setGoals((currentGoals) => currentGoals.map((goal) => goal.id === goalId
      ? { ...goal, ...updates, ...(updates.title ? { icon: matchGoalIcon(updates.title) } : {}) }
      : goal));
  };

  const adjustCurrent = (goalId: string, direction: 1 | -1) => {
    const amount = Number(adjustments[goalId]);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback((current) => ({ ...current, [goalId]: "请输入有效金额" }));
      return;
    }

    const selectedGoal = goals.find((goal) => goal.id === goalId);
    if (!selectedGoal) return;
    const nextCurrent = Math.max(0, selectedGoal.current + amount * direction);
    const change = nextCurrent - selectedGoal.current;
    const appliedAmount = Math.abs(change);
    const recordId = `record-${Date.now()}-${goalId}`;
    const recordDate = new Date().toISOString().slice(0, 10);

    setGoals((currentGoals) => currentGoals.map((goal) => {
      if (goal.id !== goalId || change === 0) return goal;
      return {
        ...goal,
        current: nextCurrent,
        records: [{
          id: recordId,
          date: recordDate,
          amount: change,
          note: direction === 1 ? "手动增加" : "手动减少",
          balance: nextCurrent,
        }, ...goal.records],
      };
    }));
    setAdjustments((current) => ({ ...current, [goalId]: "" }));
    setFeedback((current) => ({
      ...current,
      [goalId]: appliedAmount > 0
        ? `${direction === 1 ? "已增加" : "已减少"} ${formatCurrency(appliedAmount)}`
        : "当前累计已为 ¥ 0",
    }));
    window.setTimeout(() => setFeedback((current) => ({ ...current, [goalId]: "" })), 1800);
  };

  const createGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("goal-name") ?? "").trim();
    const target = Number(values.get("goal-target"));
    const current = Math.max(0, Number(values.get("goal-initial")) || 0);
    if (!title || !Number.isFinite(target) || target <= 0) return;

    const newGoal: GoalData = {
      id: `goal-${Date.now()}`,
      title,
      subtitle: `为「${title}」稳步积累`,
      icon: matchGoalIcon(title),
      status: "新目标",
      current,
      target,
      estimate: "待规划",
      records: current > 0 ? [{
        id: `record-${Date.now()}-initial`,
        date: new Date().toISOString().slice(0, 10),
        amount: current,
        note: "初始金额",
        balance: current,
      }] : [],
    };

    setGoals((currentGoals) => [...currentGoals, newGoal]);
    setHistoryGoal(null);
    setFlippedGoal(null);
    setCreated(true);
    window.setTimeout(() => goalListRef.current?.scrollTo({ left: goalListRef.current.scrollWidth, behavior: "smooth" }), 80);
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

          <section ref={goalListRef} className="goal-card-grid" aria-label="进行中的财富目标">
            {goals.map((goal, index) => {
              const progress = getProgress(goal);
              const trend = getGoalTrend(goal);
              const isFlipped = flippedGoal === goal.id;
              const historyOpen = historyGoal === goal.id;
              const editTabIndex = isFlipped && !historyOpen ? 0 : -1;

              return (
                <article className={`goal-card-shell ${isFlipped ? "flipped" : ""}`} key={goal.id} style={{ animationDelay: `${index * 0.1 + 0.08}s` }}>
                  <div className="goal-card-inner">
                    <section
                      className="goal-card-face goal-card-front"
                      role="button"
                      tabIndex={isFlipped ? -1 : 0}
                      aria-label={`编辑${goal.title}`}
                      aria-pressed={isFlipped}
                      onClick={() => { setHistoryGoal(null); setFlippedGoal(goal.id); }}
                      onKeyDown={(event) => flipWithKeyboard(event, goal.id)}
                    >
                      <div className="goal-card-topline">
                        <span className="goal-icon material-symbols-outlined" aria-hidden="true">{goal.icon}</span>
                        <span className={`goal-status ${goal.muted ? "muted" : ""}`}>{goal.status}</span>
                      </div>
                      <h2>{goal.title}</h2>
                      <p className="goal-subtitle">{goal.subtitle}</p>

                      <div className="goal-curve" role="img" aria-label={trend.hasTrend ? `${goal.title}最近${trend.days}天累计金额变化${formatCurrency(trend.delta)}` : `${goal.title}累计记录不足，暂未形成趋势`}>
                        <div className="goal-trend-copy"><span>{trend.hasTrend ? `累计走势 · 近 ${trend.days} 天` : "累计走势 · 等待更多记录"}</span><strong className={trend.delta < 0 ? "negative" : ""}>{trend.hasTrend ? `${trend.delta >= 0 ? "+" : "−"}${formatCompactCurrency(trend.delta)}` : "—"}</strong></div>
                        <svg viewBox="0 0 200 65" preserveAspectRatio="none">
                          <path className="goal-trend-grid" d="M0 10 H200 M0 34 H200 M0 58 H200" />
                          <path className="goal-trend-area" d={trend.areaPath} />
                          <path key={`${goal.id}-${goal.records.length}-${goal.current}`} className="goal-climb-path" d={trend.path} pathLength="1" />
                          {trend.points.map((point, pointIndex) => <circle className={pointIndex === trend.points.length - 1 ? "latest" : ""} key={`${point.x}-${point.y}-${pointIndex}`} cx={point.x} cy={point.y} r={pointIndex === trend.points.length - 1 ? 4 : 2.4} />)}
                        </svg>
                        <div className="goal-trend-range"><span>{formatCompactCurrency(trend.start)}</span><span>{formatCompactCurrency(trend.end)}</span></div>
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
                        <button type="button" onClick={() => { setHistoryGoal(null); setFlippedGoal(null); }} tabIndex={editTabIndex} aria-label={`关闭${goal.title}编辑`}>
                          <span className="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                      </div>

                      <label htmlFor={`title-${goal.id}`}>目标名称</label>
                      <input id={`title-${goal.id}`} value={goal.title} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} tabIndex={editTabIndex} />
                      <label htmlFor={`target-${goal.id}`}>目标值 (¥)</label>
                      <input id={`target-${goal.id}`} type="number" min="1" value={goal.target} onChange={(event) => updateGoal(goal.id, { target: Math.max(1, Number(event.target.value)) })} tabIndex={editTabIndex} />

                      <div className="goal-back-summary">
                        <button className="goal-history-trigger" type="button" onClick={() => setHistoryGoal(goal.id)} tabIndex={editTabIndex} aria-label={`查看${goal.title}累计记录`}>
                          <span>当前累计</span><strong>{formatCurrency(goal.current)}</strong>
                          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                        </button>
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
                            tabIndex={editTabIndex}
                          />
                          <button className="subtract" type="button" onClick={() => adjustCurrent(goal.id, -1)} tabIndex={editTabIndex} aria-label="从当前累计值中减去">−</button>
                          <button className="add" type="button" onClick={() => adjustCurrent(goal.id, 1)} tabIndex={editTabIndex} aria-label="加到当前累计值上">＋</button>
                        </div>
                        <p className={feedback[goal.id] ? "visible" : ""} role="status">{feedback[goal.id] || "输入金额后选择增加或减少"}</p>
                      </div>

                      <aside className={`goal-history-drawer ${historyOpen ? "open" : ""}`} aria-hidden={!historyOpen} aria-label={`${goal.title}累计记录`}>
                        <div className="goal-history-heading">
                          <button type="button" onClick={() => setHistoryGoal(null)} tabIndex={historyOpen ? 0 : -1} aria-label="返回目标编辑">
                            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                          </button>
                          <div><span>累计记录</span><strong>{goal.records.length} 笔</strong></div>
                        </div>
                        <div className="goal-history-total"><span>当前累计</span><strong>{formatCurrency(goal.current)}</strong></div>
                        {goal.records.length > 0 ? (
                          <div className="goal-history-list">
                            {goal.records.map((record) => (
                              <article className="goal-history-row" key={record.id}>
                                <span className="goal-history-dot" aria-hidden="true" />
                                <div><time dateTime={record.date}>{formatRecordDate(record.date)}</time><p>{record.note}</p><small>调整后累计 {formatCurrency(record.balance)}</small></div>
                                <strong className={record.amount >= 0 ? "positive" : "negative"}>{record.amount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(record.amount))}</strong>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="goal-history-empty"><span className="material-symbols-outlined" aria-hidden="true">history</span><strong>还没有累计记录</strong><p>首次调整金额后，记录会出现在这里。</p></div>
                        )}
                      </aside>
                    </section>
                  </div>
                </article>
              );
            })}
          </section>
          {goals.length > 3 && (
            <p className="goal-carousel-hint"><span className="material-symbols-outlined" aria-hidden="true">swipe</span> 左右滑动查看全部 {goals.length} 个目标</p>
          )}

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
