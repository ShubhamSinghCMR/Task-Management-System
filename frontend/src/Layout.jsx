import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isLoggedIn, getMe, clearToken } from './api'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (loggedIn) getMe().then(setUser).catch(() => setUser(null))
    else setUser(null)
  }, [loggedIn, location.pathname])

  function handleLogout() {
    clearToken()
    navigate('/')
  }

  return (
    <div className="page-wrapper">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-left">
            <Link to={loggedIn ? '/dashboard' : '/'} className="site-logo">
              Task Management
            </Link>
            {loggedIn && user && (
              <span className="site-greeting">
                <span className="site-greeting-user">Hello {user.username}</span>
                <span className="site-greeting-sep" aria-hidden> · </span>
                <span className="site-greeting-org">Org: {user.organization_name}</span>
              </span>
            )}
          </div>
          <nav className="site-nav">
            {loggedIn ? (
              <>
                {location.pathname !== '/dashboard' && (
                  <Link to="/dashboard">Dashboard</Link>
                )}
                {location.pathname !== '/dashboard/projects' && (
                  <Link to="/dashboard/projects">Manage projects</Link>
                )}
                {location.pathname !== '/dashboard/tasks' && (
                  <Link to="/dashboard/tasks">Manage tasks</Link>
                )}
                <button type="button" className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                {location.pathname !== '/' && location.pathname !== '/login' && (
                  <Link to="/login">Login</Link>
                )}
                {location.pathname !== '/' && location.pathname !== '/register' && (
                  <Link to="/register">Register</Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          Task Management
        </div>
      </footer>
    </div>
  )
}
