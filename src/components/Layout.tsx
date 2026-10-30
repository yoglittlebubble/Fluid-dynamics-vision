import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/', label: '首页', end: true },
  { to: '/streamline', label: '流线 / 迹线' },
  { to: '/euler-lagrange', label: '欧拉 / 拉格朗日' },
  { to: '/continuity', label: '连续性方程' },
  { to: '/bernoulli', label: '伯努利方程' },
  { to: '/pitot', label: '皮托管' },
  { to: '/momentum', label: '动量方程' },
  { to: '/headlines', label: '水头线' },
]

export function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">流体</span>
          <div>
            <div className="brand-title">流体动力学可视化学习站</div>
            <div className="brand-sub">一元流体动力学 · Canvas 交互示意</div>
          </div>
        </div>
      </header>
      <div className="body">
        <nav className="sidebar">
          <div className="nav-section">章节导航</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
