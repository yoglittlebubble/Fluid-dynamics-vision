import { Link } from 'react-router-dom'
import { TopicPreview } from '../components/TopicPreview'

const CARDS = [
  {
    to: '/streamline',
    title: '流线 · 迹线 · 恒定与非恒定',
    desc: '同一时刻流线不相交；恒定流下流线与迹线重合，非恒定流则分离。',
  },
  {
    to: '/euler-lagrange',
    title: '欧拉法 vs 拉格朗日法',
    desc: '流场法看固定点上的速度变化；质点系法跟踪个别质点轨迹。',
  },
  {
    to: '/continuity',
    title: '连续性方程',
    desc: '不可压缩流体：断面变窄处流速增大，流量守恒 Q = vA。',
  },
  {
    to: '/bernoulli',
    title: '伯努利（能量）方程',
    desc: '沿流线总水头守恒示意：位置水头、压强水头与流速水头互换。',
  },
  {
    to: '/pitot',
    title: '皮托管测速',
    desc: '驻点压强与静压差推流速：u = √(2Δp/ρ)。',
  },
  {
    to: '/momentum',
    title: '动量方程 · 弯管受力',
    desc: '控制体动量变化 = 外力，求流体对弯管的作用力。',
  },
  {
    to: '/headlines',
    title: '总水头线与测压管水头线',
    desc: '沿程水头分布：理想无损失 vs 有损失的对比。',
  },
]

export function Home() {
  return (
    <div className="page">
      <h1>一元流体动力学 · 可视化学习</h1>
      <p className="lead">
        本站用纯 Canvas 2D 交互演示「流体动力学」核心概念。每个页面可暂停、调参、
        点选种子点，配合中文说明理解定义与性质。适合对照课堂讲义自学。
      </p>
      <div className="card-grid">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="topic-card">
            <TopicPreview topic={c.to} />
            <h2>{c.title}</h2>
            <p>{c.desc}</p>
            <span className="card-go">进入演示 →</span>
          </Link>
        ))}
      </div>
      <section className="note-box">
        <h3>使用提示</h3>
        <ul>
          <li>侧边栏切换章节；多数页面支持「播放 / 暂停」与参数滑条。</li>
          <li>流线/迹线页可点击画布投放示踪质点。</li>
          <li>演示侧重几何直觉，公式系数已简化，不替代正式推导。</li>
        </ul>
      </section>
    </div>
  )
}
