import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { track } from '../api/client'
import styles from './Charts.module.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>
        {payload[0].value.toLocaleString()} <span>clicks</span>
      </p>
    </div>
  )
}

export default function TrendLineChart({ data, selectedFeature, onFetchFeatureTrend, onTrackComplete }) {
  const [featureTrend, setFeatureTrend] = useState([])
  const [loading, setLoading]           = useState(false)

  // FIX Bug #12: onFetchFeatureTrend is now memoized in DashboardPage (useCallback),
  // so it's safe to include it in the dependency array without causing infinite loops.
  useEffect(() => {
    if (!selectedFeature || !onFetchFeatureTrend) {
      setFeatureTrend([])
      return
    }
    setLoading(true)
    onFetchFeatureTrend(selectedFeature)
      .then(rows => setFeatureTrend(rows || []))
      .finally(() => setLoading(false))
  }, [selectedFeature, onFetchFeatureTrend])

  // FIX Bug #7: title was "Clicks Daily" in empty states, "Daily Trend" when data showed.
  // Now consistently "Daily Trend" everywhere.

  // FIX Bug #8: plain-text loading state replaced with proper spinner.
  if (!selectedFeature) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Daily Trend</h3>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><TrendingUp size={18} /></div>
          Select a feature from the bar chart
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Daily Trend</h3>
          <span className={styles.badge}>{selectedFeature}</span>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.chartSpinner} />
          <span>Loading trend data…</span>
        </div>
      </div>
    )
  }

  const displayData = featureTrend.length > 0 ? featureTrend : data

  if (!displayData || displayData.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Daily Trend</h3>
          <span className={styles.badge}>{selectedFeature}</span>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><TrendingUp size={18} /></div>
          No trend data for &ldquo;{selectedFeature}&rdquo;
        </div>
      </div>
    )
  }

  const formattedData = displayData.map(d => ({
    ...d,
    label: (() => {
      try { return format(parseISO(d.date), 'MMM d') }
      catch { return d.date }
    })(),
  }))

  const total = displayData.reduce((s, d) => s + d.click_count, 0)
  const avg   = displayData.length > 0 ? Math.round(total / displayData.length) : 0

  const handleChartClick = () => {
    track('line_chart_view', { value: selectedFeature }).finally(() => {
      if (onTrackComplete) onTrackComplete()
    })
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Daily Trend</h3>
        <span className={styles.badge}>{selectedFeature}</span>
      </div>
      <p className={styles.chartHint}>Click the chart to track · Daily clicks for selected feature</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.8)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={{ stroke: '#e4e9f2' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="rgba(79,70,229,0.35)"
              strokeDasharray="4 4"
              label={{
                value: `avg ${avg}`,
                fill: '#4f46e5',
                fontSize: 10,
                fontFamily: 'DM Mono, monospace', // FIX Bug #9: was 'Space Mono'
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="click_count"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ fill: '#4f46e5', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: 'rgba(79,70,229,0.25)', strokeWidth: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
