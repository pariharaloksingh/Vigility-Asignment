import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login, track } from '../api/client'
import { useAuth } from '../hooks/useAuth.jsx'
import { Zap, AlertCircle, UserPlus } from 'lucide-react'
import styles from './Auth.module.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', age: '', gender: 'Male' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, age: parseInt(form.age) })
      const res = await login({ username: form.username, password: form.password })
      const user = res.data.user || { username: form.username }
      loginUser(user, res.data.token || res.data.access_token)
      setTimeout(() => {
        track('user_register', {
          value: form.username,
          userId: user.id,
          age: parseInt(form.age),
          gender: form.gender,
          registerTime: new Date().toISOString()
        })
      }, 100)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Registration failed')
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
            Start tracking in minutes
          </h2>
          <p className={styles.leftSub}>
            Create your free account and instantly get access to powerful click analytics, trend charts, and demographic filters.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Free to get started
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Real-time event tracking
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Beautiful analytics dashboard
            </li>
            <li className={styles.featureItem}>
              <span className={styles.featureDot} />
              Secure & privacy-first
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

          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join thousands of teams using Vigility</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Choose a username"
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
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Age</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Your age"
                  min="1"
                  max="100"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Gender</label>
                <select
                  className={styles.input}
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {error && (
              <p className={styles.error}>
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <button className={styles.btn} type="submit" disabled={loading}>
              {loading
                ? <span className={styles.spinner} />
                : <><UserPlus size={16} /><span>Create Account</span></>
              }
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
