import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { track } from '../api/client'
import styles from './Charts.module.css'

const COLORS = ['#4f46e5', '#0ea5e9', '#059669', '#f59e0b', '#e11d48', '#7c3aed', '#0d9488']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>
        {payload[0].value} <span>clicks</span>
      </p>
    </div>
  )
}

/**
 * Props:
 *   data           : [{ featureName: string, count: number }]
 *   selectedFeature: string | null
 *   onSelectFeature: (featureName: string) => void
 *   onTrackComplete: () => void
 */
export default function FeatureBarChart({ data, selectedFeature, onSelectFeature, onTrackComplete }) {
  // data already arrives normalised from Dashboard (count is Number)
  const chartData = (data || []).map(item => ({
    name:  item.featureName,
    count: item.count,          // already Number
  }))

  const handleClick = (entry) => {
    if (!entry) return
    track('bar_chart_click', { value: entry.name }).then(() => {
      if (onTrackComplete) onTrackComplete()
    })
    onSelectFeature(entry.name)
  }

  if (!chartData.length) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Clicks by Feature</h3>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><BarChart3 size={18} /></div>
          Noo data available
        </div>
      </div>
    )
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Clicks by Feature</h3>
        {selectedFeature && (
          <span className={styles.badge}>{selectedFeature}</span>
        )}
      </div>
      <p className={styles.chartHint}>Click a bar to view its time trend →</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={(e) => e?.activePayload && handleClick(e.activePayload[0]?.payload)}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(226,232,240,0.8)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
            axisLine={{ stroke: '#e4e9f2' }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(79,70,229,0.04)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.name === selectedFeature ? '#fff' : COLORS[i % COLORS.length]}
                opacity={selectedFeature && entry.name !== selectedFeature ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}