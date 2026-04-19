import styles from './StatCards.module.css'
import { MousePointerClick, Trophy, Layers, AreaChart, Gauge, CalendarCheck } from 'lucide-react'

export default function StatCards({ barChart = [], lineChart = [] }) {
  const totalClicks   = barChart.reduce((sum, f) => sum + Number(f.count), 0)
  const topFeature    = barChart.length > 0
    ? [...barChart].sort((a, b) => Number(b.count) - Number(a.count))[0].featureName.replace(/_/g, ' ')
    : '—'
  const uniqueFeatures = barChart.length
  const trendTotal     = lineChart.reduce((s, d) => s + Number(d.count), 0)
  const avgDaily       = lineChart.length > 0 ? Math.round(trendTotal / lineChart.length) : 0

  const cards = [
    {
      icon: MousePointerClick,
      label: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      color: '#4f46e5',
    },
    {
      icon: Trophy,
      label: 'Most Used Feature',
      value: topFeature,
      color: '#059669',
      truncate: true,
    },
    {
      icon: Layers,
      label: 'Features Tracked',
      value: uniqueFeatures.toLocaleString(),
      color: '#f59e0b',
    },
    {
      icon: AreaChart,
      label: 'Timeline Clicks',
      value: trendTotal.toLocaleString(),
      color: '#e11d48',
    },
    {
      icon: Gauge,
      label: 'Avg Clicks / Day',
      value: avgDaily.toLocaleString(),
      color: '#0ea5e9',
    },
    {
      icon: CalendarCheck,
      label: 'Days with Activity',
      value: lineChart.length.toLocaleString(),
      color: '#7c3aed',
    },
  ]

  return (
    <div className={styles.grid}>
      {cards.map((c, i) => (
        <div
          key={i}
          className={styles.card}
          style={{ '--card-color': c.color, animationDelay: `${i * 0.07}s` }}
        >
          <div className={styles.iconBox}>
            <c.icon size={20} color="#fff" strokeWidth={1.8} />
          </div>
          <div className={styles.info}>
            <span className={styles.label}>{c.label}</span>
            <span className={`${styles.value} ${c.truncate ? styles.truncate : ''}`}>
              {c.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}