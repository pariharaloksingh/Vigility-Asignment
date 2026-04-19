import { useState } from 'react'
import Cookies from 'js-cookie'
import { subDays, isValid, isAfter } from 'date-fns'

// ─── Cookie keys & options ─────────────────────────────────────────────────

const COOKIE_KEYS = {
  startDate: 'vg_start_date',
  endDate:   'vg_end_date',
  age:       'vg_age',
  gender:    'vg_gender',
}

const COOKIE_OPTS = { expires: 7, sameSite: 'lax' }

const VALID_AGE_VALUES    = new Set(['all', '<18', '18-40', '>40'])
const VALID_GENDER_VALUES = new Set(['all', 'Male', 'Female', 'Other'])

// ─── Defaults ──────────────────────────────────────────────────────────────

/**
 * Returns fresh default filters computed at call-time (not module-load-time).
 * Exported so FilterBar can call it for the Reset button.
 */
export function getDefaultFilters() {
  return {
    startDate: subDays(new Date(), 30),
    endDate:   new Date(),
    age:       'all',
    gender:    'all',
  }
}

// ─── Cookie helpers ────────────────────────────────────────────────────────

/**
 * Reads each filter from its individual cookie.
 * Returns a complete filters object, or null if cookies are absent / invalid.
 */
export function getInitialFiltersFromCookies() {
  try {
    const rawStart  = Cookies.get(COOKIE_KEYS.startDate)
    const rawEnd    = Cookies.get(COOKIE_KEYS.endDate)
    const rawAge    = Cookies.get(COOKIE_KEYS.age)
    const rawGender = Cookies.get(COOKIE_KEYS.gender)

    if (!rawStart && !rawEnd && !rawAge && !rawGender) return null

    const startDate = rawStart ? new Date(rawStart) : null
    const endDate   = rawEnd   ? new Date(rawEnd)   : null

    if (!startDate || !isValid(startDate) || !endDate || !isValid(endDate)) return null
    if (isAfter(startDate, endDate)) return null

    const age    = rawAge    && VALID_AGE_VALUES.has(rawAge)       ? rawAge    : 'all'
    const gender = rawGender && VALID_GENDER_VALUES.has(rawGender) ? rawGender : 'all'

    return { startDate, endDate, age, gender }
  } catch {
    return null
  }
}

/**
 * Writes each filter value to its own cookie.
 * Invalid values remove the corresponding cookie.
 */
export function saveFiltersToCookies(filters) {
  try {
    if (filters.startDate instanceof Date && isValid(filters.startDate)) {
      Cookies.set(COOKIE_KEYS.startDate, filters.startDate.toISOString(), COOKIE_OPTS)
    } else {
      Cookies.remove(COOKIE_KEYS.startDate)
    }

    if (filters.endDate instanceof Date && isValid(filters.endDate)) {
      Cookies.set(COOKIE_KEYS.endDate, filters.endDate.toISOString(), COOKIE_OPTS)
    } else {
      Cookies.remove(COOKIE_KEYS.endDate)
    }

    if (filters.age && VALID_AGE_VALUES.has(filters.age)) {
      Cookies.set(COOKIE_KEYS.age, filters.age, COOKIE_OPTS)
    }

    if (filters.gender && VALID_GENDER_VALUES.has(filters.gender)) {
      Cookies.set(COOKIE_KEYS.gender, filters.gender, COOKIE_OPTS)
    }
  } catch {
    // Fail silently in private-browsing or cookie-blocked environments
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useFilters() {
  const [filters, setFiltersState] = useState(
    () => getInitialFiltersFromCookies() ?? getDefaultFilters()
  )

  const setFilters = (update) => {
    setFiltersState(prev => {
      const next = typeof update === 'function'
        ? update(prev)
        : { ...prev, ...update }

      saveFiltersToCookies(next)
      return next
    })
  }

  return { filters, setFilters }
}
