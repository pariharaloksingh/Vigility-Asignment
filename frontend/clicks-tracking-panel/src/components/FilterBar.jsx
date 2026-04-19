import { useState, useRef, useEffect } from 'react'
import DateRangePicker from './DateRangePicker'
import { track } from '../api/client'
import { getDefaultFilters } from '../hooks/useFilters'
import { CalendarRange, UsersRound, VenetianMask, RefreshCw, RotateCcw } from 'lucide-react'
import styles from './FilterBar.module.css'
import { format } from 'date-fns'

const AGE_OPTIONS = [
  { value: 'all',   label: 'All Ages'  },
  { value: '<18',   label: 'Under 18'  },
  { value: '18-40', label: '18–40'     },
  { value: '>40',   label: 'Over 40'   },
]

const GENDER_OPTIONS = [
  { value: 'all',    label: 'All Genders' },
  { value: 'Male',   label: 'Male'        },
  { value: 'Female', label: 'Female'      },
  { value: 'Other',  label: 'Other'       },
]

export default function FilterBar({ filters, setFilters, onRefresh, loading }) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)

  // Close picker when clicking outside .dateWrapper
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  // FIX Bug #4: Removed `.finally(() => onRefresh())` from all filter handlers.
  // setFilters() triggers useEffect([filters]) in DashboardPage → fetchData().
  // Calling onRefresh() in .finally() caused a redundant second fetch after every
  // filter change. The explicit Refresh button still calls onRefresh() directly.

  const handleDateChange = ({ start, end }) => {
    setFilters({ startDate: start, endDate: end })
    track('date_filter', {
      value: `${format(start, 'yyyy-MM-dd')} to ${end ? format(end, 'yyyy-MM-dd') : ''}`,
    })
    setShowPicker(false)
  }

  const handleAge = (e) => {
    const age = e.target.value
    setFilters({ age })
    track('age_filter', { value: age })
  }

  const handleGender = (e) => {
    const gender = e.target.value
    setFilters({ gender })
    track('gender_filter', { value: gender })
  }

  // FIX Bug #13: Added Reset button — resets all filters to last-30-days defaults.
  // Uses getDefaultFilters() so dates are computed fresh at click-time, not stale.
  const handleReset = () => {
    const defaults = getDefaultFilters()
    setFilters(defaults)
    track('reset_filters', { value: 'reset' })
    setShowPicker(false)
  }

  // Refresh button: explicit user action, calls onRefresh directly
  const handleRefresh = () => {
    track('refresh_button', { value: 'refresh' }).finally(() => onRefresh())
  }

  const formatDateDisplay = () => {
    if (!filters.startDate) return 'Select date range'
    const start = format(filters.startDate, 'MMM d, yyyy')
    const end   = filters.endDate ? format(filters.endDate, 'MMM d, yyyy') : '...'
    return `${start} – ${end}`
  }

  const hasActiveFilters =
    filters.age !== 'all' ||
    filters.gender !== 'all'

  return (
    <div className={styles.bar}>
      {/* Date Range */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          <CalendarRange size={13} />
          <span>Date Range</span>
        </div>
        <div className={styles.dateWrapper} ref={pickerRef}>
          <button
            className={styles.dateInput}
            onClick={() => setShowPicker(v => !v)}
          >
            {formatDateDisplay()}
          </button>
          {showPicker && (
            <div className={styles.pickerDropdown}>
              <DateRangePicker
                value={{ start: filters.startDate, end: filters.endDate }}
                onChange={handleDateChange}
                onClose={() => setShowPicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Age */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          <UsersRound size={13} />
          <span>Age Group</span>
        </div>
        <select className={styles.select} value={filters.age} onChange={handleAge}>
          {AGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div className={styles.group}>
        <div className={styles.groupLabel}>
          <VenetianMask size={13} />
          <span>Gender</span>
        </div>
        <select className={styles.select} value={filters.gender} onChange={handleGender}>
          {GENDER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {hasActiveFilters && (
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            title="Reset filters to defaults"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  )
}
