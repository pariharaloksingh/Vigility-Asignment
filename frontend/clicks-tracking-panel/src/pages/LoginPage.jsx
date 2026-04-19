import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, track } from '../api/client'
import { useAuth } from '../hooks/useAuth.jsx'
import { Zap, AlertCircle, ArrowRight, BarChart3, ShieldCheck, Sparkles } from 'lucide-react'
import styles from './Auth.module.css'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      const user = res.data.user || { username: form.username }
      loginUser(user, res.data.token || res.data.access_token)
      track('user_login', {
        value: form.username,
        userId: user.id,
        loginTime: new Date().toISOString()
      })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Left branding panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon}>
              <Zap size={20} color="#fff" />
            </div>
            <span className={styles.brandName}>VIGILITY</span>
          </div>

          <h2 className={styles.leftHeadline}>
            Real-time analytics for every click
          </h2>
          <p className={styles.leftSub}>
            Track user interactions, visualize trends, and make data-driven decisions with our powerful analytics platform.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Live click-stream tracking
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Feature-level usage analytics
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Demographic filters (age, gender)
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Interactive trend charts
            </li>
          </ul>
        </div>

        <div className={styles.leftBottom}>
          © 2025 Vigility · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          {/* Logo — visible on mobile only */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}><Zap size={18} color="#fff" /></div>
            <span className={styles.logoText}>VIGILITY</span>
          </div>

          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your analytics dashboard</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className={styles.error}>
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading
                ? <span className={styles.spinner} />
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className={styles.link}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
