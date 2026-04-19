import styles from './Charts.module.css'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6c63ff', '#ff6584', '#43e97b', '#f7971e', '#56ccf2', '#a78bfa', '#fb7185']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value} <span>clicks</span></p>
    </div>
  )
}

export default function FeatureValueChart({ data, title = 'Feature Values' }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>{title}</h3>
        <div className={styles.empty}>No value data available</div>
      </div>
    )
  }

  // Group by featureName and show top values
  const chartData = data.slice(0, 10).map(item => ({
    name: item.feature_value?.length > 20 ? item.feature_value.substring(0, 20) + '...' : item.feature_value,
    fullValue: item.feature_value,
    feature: item.featureName,
    count: item.count
  }))

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        <span className={styles.badge}>{data.length} unique values</span>
      </div>
      <p className={styles.chartHint}>Most selected values across all features</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#7a7a99', fontSize: 11, fontFamily: 'Space Mono' }}
            axisLine={{ stroke: '#2a2a3a' }}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#7a7a99', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(108,99,255,0.06)' }}
            formatter={(value, name, props) => [value, props.payload.fullValue]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
