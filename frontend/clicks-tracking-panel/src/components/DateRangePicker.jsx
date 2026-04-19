import { useState, useEffect } from 'react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay,
  setHours, setMinutes
} from 'date-fns'
import { track } from '../api/client'
import styles from './DateRangePicker.module.css'

const PRESETS = [
  { label: 'Today',       getRange: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Yesterday',   getRange: () => { const y = addDays(new Date(), -1); return { start: y, end: y } } },
  { label: 'Last 7 Days', getRange: () => ({ start: addDays(new Date(), -6),  end: new Date() }) },
  { label: 'Last 30 Days',getRange: () => ({ start: addDays(new Date(), -29), end: new Date() }) },
  { label: 'This Month',  getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Custom Range',getRange: () => null },
]

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

// Convert 12-hour + ampm → 0-23 hour
function to24Hour(hour, ampm) {
  if (ampm === 'AM') return hour === 12 ? 0  : hour
  else               return hour === 12 ? 12 : hour + 12
}

export default function DateRangePicker({ value, onChange, onClose }) {
  const [leftMonth,    setLeftMonth]   = useState(value.start || new Date())
  const [rightMonth,   setRightMonth]  = useState(addMonths(value.start || new Date(), 1))
  const [selection,    setSelection]   = useState({ start: value.start || null, end: value.end || null })
  const [selecting,    setSelecting]   = useState('start')
  const [startTime,    setStartTime]   = useState({ hour: 12, minute: 0,  ampm: 'AM' })
  const [endTime,      setEndTime]     = useState({ hour: 11, minute: 59, ampm: 'PM' })
  const [activePreset, setActivePreset]= useState(null)

  // FIX Bug #10: Removed duplicate outside-click listener.
  // FilterBar already attaches a mousedown listener on document that closes the picker
  // when clicking outside .dateWrapper (which contains this component).
  // Having two listeners caused onClose() to fire twice on outside clicks.

  const renderMonth = (date) => {
    const monthStart = startOfMonth(date)
    const monthEnd   = endOfMonth(date)
    const startDate  = startOfWeek(monthStart)
    const endDate    = endOfWeek(monthEnd)

    const weeks = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay      = day
        const isCurrentMonth  = isSameMonth(day, date)
        const isStart         = selection.start && isSameDay(day, selection.start)
        const isEnd           = selection.end   && isSameDay(day, selection.end)
        const isInRange       = selection.start && selection.end &&
                                day > selection.start && day < selection.end

        days.push(
          <button
            key={day.toISOString()}
            className={[
              styles.day,
              !isCurrentMonth ? styles.otherMonth : '',
              (isStart || isEnd) ? styles.selected : '',
              isInRange          ? styles.inRange  : '',
            ].join(' ')}
            onClick={() => handleDayClick(currentDay)}
          >
            {format(day, 'd')}
          </button>
        )
        day = addDays(day, 1)
      }
      weeks.push(<div key={day.toISOString()} className={styles.week}>{days}</div>)
      days = []
    }
    return weeks
  }

  const handleDayClick = (day) => {
    setActivePreset(null)
    if (!selection.start || selecting === 'start') {
      setSelection({ start: day, end: null })
      setSelecting('end')
    } else {
      if (day < selection.start) {
        setSelection({ start: day, end: selection.start })
      } else {
        setSelection({ ...selection, end: day })
      }
      setSelecting('start')
    }
  }

  const handlePresetClick = (preset, index) => {
    if (preset.label === 'Custom Range') { setActivePreset(index); return }
    const range = preset.getRange()
    if (range) {
      setSelection(range)
      setLeftMonth(range.start)
      setRightMonth(addMonths(range.start, 1))
      setActivePreset(index)
    }
  }

  // FIX Bug #1: pass time-adjusted startDate/endDate to onChange, not raw selection.
  // Previously the computed startDate/endDate variables were discarded and
  // onChange received the original dates without any time applied.
  const handleApply = () => {
    if (!selection.start || !selection.end) return

    let startDate = new Date(selection.start)
    startDate = setHours(startDate, to24Hour(startTime.hour, startTime.ampm))
    startDate = setMinutes(startDate, startTime.minute)

    let endDate = new Date(selection.end)
    endDate = setHours(endDate, to24Hour(endTime.hour, endTime.ampm))
    endDate = setMinutes(endDate, endTime.minute)

    onChange({ start: startDate, end: endDate })
    onClose?.()
  }

  const formatDisplayRange = () => {
    if (!selection.start) return 'Select a start date'
    const start = format(selection.start, 'MMM d, yyyy')
    const end   = selection.end ? format(selection.end, 'MMM d, yyyy') : '...'
    return `${start} → ${end}`
  }

  return (
    <div className={styles.container}>
      {/* Presets sidebar */}
      <div className={styles.presets}>
        <div className={styles.presetsTitle}>Quick Select</div>
        {PRESETS.map((preset, index) => (
          <button
            key={preset.label}
            className={`${styles.presetBtn} ${activePreset === index ? styles.presetActive : ''}`}
            onClick={() => handlePresetClick(preset, index)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main calendar area */}
      <div className={styles.main}>
        <div className={styles.rangeDisplay}>{formatDisplayRange()}</div>

        <div className={styles.calendars}>
          {/* Left month */}
          <div className={styles.month}>
            <div className={styles.monthHeader}>
              <button onClick={() => setLeftMonth(m => subMonths(m, 1))} className={styles.navBtn}>‹</button>
              <span>{format(leftMonth, 'MMMM yyyy')}</span>
              <div style={{ width: 28 }} />
            </div>
            <div className={styles.weekdays}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <span key={d} className={styles.weekday}>{d}</span>
              ))}
            </div>
            <div className={styles.days}>{renderMonth(leftMonth)}</div>
          </div>

          {/* Right month */}
          <div className={styles.month}>
            <div className={styles.monthHeader}>
              <div style={{ width: 28 }} />
              <span>{format(rightMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setRightMonth(m => addMonths(m, 1))} className={styles.navBtn}>›</button>
            </div>
            <div className={styles.weekdays}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <span key={d} className={styles.weekday}>{d}</span>
              ))}
            </div>
            <div className={styles.days}>{renderMonth(rightMonth)}</div>
          </div>
        </div>

        {/* Time pickers */}
        <div className={styles.timePickers}>
          <div className={styles.timeGroup}>
            <span className={styles.timeLabel}>Start</span>
            <select value={startTime.hour}   onChange={e => setStartTime(s => ({ ...s, hour: parseInt(e.target.value) }))}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className={styles.timeSep}>:</span>
            <select value={startTime.minute} onChange={e => setStartTime(s => ({ ...s, minute: parseInt(e.target.value) }))}>
              {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
            </select>
            <select value={startTime.ampm}   onChange={e => setStartTime(s => ({ ...s, ampm: e.target.value }))}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <div className={styles.timeGroup}>
            <span className={styles.timeLabel}>End</span>
            <select value={endTime.hour}   onChange={e => setEndTime(s => ({ ...s, hour: parseInt(e.target.value) }))}>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className={styles.timeSep}>:</span>
            <select value={endTime.minute} onChange={e => setEndTime(s => ({ ...s, minute: parseInt(e.target.value) }))}>
              {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
            </select>
            <select value={endTime.ampm}   onChange={e => setEndTime(s => ({ ...s, ampm: e.target.value }))}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.applyBtn}
            onClick={handleApply}
            disabled={!selection.start || !selection.end}
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  )
}
