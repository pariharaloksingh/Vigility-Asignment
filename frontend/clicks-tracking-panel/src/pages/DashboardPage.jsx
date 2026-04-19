import { useState, useEffect, useCallback, useRef } from 'react'
import { getAnalytics, track } from '../api/client'
import { useFilters } from '../hooks/useFilters'
import { format } from 'date-fns'
import { LayoutDashboard, AlertCircle, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import FilterBar from '../components/FilterBar'
import FeatureBarChart from '../components/FeatureBarChart'
import TrendLineChart from '../components/TrendLineChart'
import StatCards from '../components/StatCards'
import styles from './Dashboard.module.css'

export default function DashboardPage() {
  const { filters, setFilters } = useFilters()
  const [analyticsData, setAnalyticsData]   = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  // Track page view once on mount
  const pageViewTracked = useRef(false)
  useEffect(() => {
    if (!pageViewTracked.current) {
      pageViewTracked.current = true
      track('page_view')
    }
  }, [])

  // Keep a ref to always-current filters so useCallback closures stay fresh
  const filtersRef = useRef(filters)
  useEffect(() => { filtersRef.current = filters }, [filters])

  const buildParams = useCallback(() => {
    const params = {}
    const f = filtersRef.current
    if (f.startDate) params.start_date = format(f.startDate, 'yyyy-MM-dd')
    if (f.endDate)   params.end_date   = format(f.endDate,   'yyyy-MM-dd')
    if (f.age && f.age !== 'all') {
      if      (f.age === '<18')   { params.age_min = 0;  params.age_max = 17  }
      else if (f.age === '18-40') { params.age_min = 18; params.age_max = 40  }
      else if (f.age === '>40')   { params.age_min = 41; params.age_max = 150 }
    }
    if (f.gender && f.gender !== 'all') params.gender = f.gender
    return params
  }, []) // intentionally empty — reads via ref to avoid stale closure

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAnalytics(buildParams())
      setAnalyticsData(res.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail  ||
        err.response?.data?.msg     ||
        'Failed to fetch analytics. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  // Re-fetch whenever filters change. fetchData is stable (useCallback + stable deps).
  useEffect(() => { fetchData() }, [filters, fetchData])

  // FIX Bug #2 & #3: removed track() and fetchData() from here.
  // FeatureBarChart.handleClick already calls track + onTrackComplete(=fetchData).
  // Calling them again here caused double tracking + double API fetch per click.
  const handleSelectFeature = (feature) => {
    setSelectedFeature(prev => prev === feature ? null : feature)
  }

  // FIX Bug #12: memoize so TrendLineChart gets a stable function reference.
  // This allows TrendLineChart's useEffect to properly list it as a dependency.
  const fetchFeatureTrend = useCallback(async (feature) => {
    setLoading(true)
    try {
      const params = { ...buildParams(), featureName: feature }
      const res = await getAnalytics(params)
      return (res.data.lineChart || []).map(d => ({
        date:        d.date,
        click_count: Number(d.count),
      }))
    } catch {
      return []
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const barChartRaw  = analyticsData?.barChart  || []
  const lineChartRaw = analyticsData?.lineChart || []

  const featureUsage = barChartRaw.map(item => ({
    featureName: item.featureName,
    count: Number(item.count),
  }))

  const timeTrend = lineChartRaw.map(item => ({
    date:        item.date,
    click_count: Number(item.count),
  }))

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroIcon}>
              <LayoutDashboard size={22} color="#fff" />
            </div>
            <div className={styles.heroText}>
              <h1 className={styles.title}>Analytics Dashboard</h1>
              <p className={styles.subtitle}>
                Real-time feature interactions
                <span className={styles.subtitleDot} />
                Self-referential tracking
              </p>
            </div>
          </div>

          {loading && (
            <div className={styles.loadingChip}>
              <span className={styles.loadSpinner} />
              Updating data…
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className={styles.main}>
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <StatCards barChart={barChartRaw} lineChart={lineChartRaw} />

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onRefresh={fetchData}
          loading={loading}
        />

        <div className={styles.chartsGrid}>
          <FeatureBarChart
            data={featureUsage}
            selectedFeature={selectedFeature}
            onSelectFeature={handleSelectFeature}
            onTrackComplete={fetchData}
          />
          <TrendLineChart
            data={timeTrend}
            selectedFeature={selectedFeature}
            onTrackComplete={fetchData}
            onFetchFeatureTrend={fetchFeatureTrend}
          />
        </div>

      
      </main>
    </div>
  )
}
