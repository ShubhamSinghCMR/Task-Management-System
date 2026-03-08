import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { login, isLoggedIn } from './api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  if (isLoggedIn()) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      let msg = err.message || 'Login failed'
      try {
        const body = JSON.parse(msg)
        if (body.detail) msg = body.detail
      } catch (_) {}
      setError(msg)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Login</h1>
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
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
        <p className="link-row">
          <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
