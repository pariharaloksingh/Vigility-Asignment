import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import { LogOut, Zap, Menu, X, Radio } from 'lucide-react'
import { track } from '../api/client'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    track('user_logout', { value: user?.username || 'unknown' })
    logoutUser()
    navigate('/login')
  }

  const initial = user?.username?.[0]?.toUpperCase() || '?'

  return (
    <>
      <nav className={styles.nav}>
        {/* Brand */}
        <div className={styles.brand}>
         
          <span className={styles.brandText}>VIGILITY</span>
          <span className={styles.brandDivider} />
          <span className={styles.brandSub}>Analytics</span>
        </div>

        {/* Center — truly centered via grid column 2 */}
    

        {/* Desktop right */}
        <div className={styles.right}>
          {user && (
            <div className={styles.userBadge}>
              <div className={styles.avatar}>{initial}</div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{user.username}</span>
                <span className={styles.userStatus}>
                  <span className={styles.dot} />
                  Online
                </span>
              </div>
            </div>
          )}

          <div className={styles.divider} />

          <button className={styles.logout} onClick={handleLogout} title="Sign out">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileSheet} onClick={e => e.stopPropagation()}>
            {/* User card */}
            {user && (
              <div className={styles.mobileUser}>
                <div className={styles.mobileAvatar}>{initial}</div>
                <div>
                  <div className={styles.mobileUserName}>{user.username}</div>
                  <div className={styles.mobileUserStatus}>
                    <span className={styles.dot} />
                    Online
                  </div>
                </div>
                <span className={styles.mobileLiveBadge}>
                  <Radio size={9} />
                  LIVE
                </span>
              </div>
            )}

            <button className={styles.mobileLogout} onClick={handleLogout}>
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
