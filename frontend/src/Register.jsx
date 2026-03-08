import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { register, getOrganizations, isLoggedIn } from './api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [orgs, setOrgs] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  if (isLoggedIn()) return <Navigate to="/dashboard" replace />

  useEffect(() => {
    getOrganizations().then(setOrgs).catch(() => setOrgs([]))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => {
      setToast('')
      navigate('/login')
    }, 2000)
    return () => clearTimeout(t)
  }, [toast, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await register(username, password, Number(organizationId), email)
      setToast('Registered successfully. Redirecting to login…')
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      {toast && <div className="toast" role="alert">{toast}</div>}
      <div className="card auth-card">
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email (optional)</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Organization</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
            >
              <option value="">Select organization</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Register
          </button>
        </form>
        <p className="link-row">
          <Link to="/login">Already have an account? Login</Link>
        </p>
      </div>
    </div>
  )
}
