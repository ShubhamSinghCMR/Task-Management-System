import { Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './api'
import Layout from './Layout'
import Welcome from './Welcome'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import ManageProjects from './ManageProjects'
import ManageTasks from './ManageTasks'

function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/projects"
          element={
            <RequireAuth>
              <ManageProjects />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <RequireAuth>
              <ManageTasks />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
