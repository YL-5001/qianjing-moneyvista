type SiteHeaderProps = {
  active: "dashboard" | "assets" | "goals" | "reports";
};

const navItems = [
  { key: "dashboard", label: "仪表盘", href: "/#dashboard" },
  { key: "assets", label: "资产", href: "/#assets" },
  { key: "goals", label: "目标", href: "/goals" },
  { key: "reports", label: "报告", href: "/#reports" },
] as const;

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <div className="nav-shell">
        <a className="brand" href={active === "dashboard" ? "#top" : "/"} aria-label="钱景首页">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-chart">↗</span>
            <span className="brand-mini">MoneyVista</span>
          </span>
          <span className="brand-name">钱景</span>
        </a>

        <nav className="desktop-nav" aria-label="主要导航">
          {navItems.map((item) => (
            <a key={item.key} className={active === item.key ? "active" : undefined} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <button className="icon-button notification" type="button" aria-label="通知">
          <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
        </button>
      </div>
    </header>
  );
}
