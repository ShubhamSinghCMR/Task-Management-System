import { Link } from 'react-router-dom'

export default function Welcome() {
  const features = [
    'Projects and tasks with statuses todo / in progress / done',
    'Assign tasks to someone in your org',
    'Only assignee or project owner can mark a task done',
    'Comments on tasks (add and view)',
    'One org per user, data isolated by org',
  ]

  return (
    <div className="welcome-page">
      <div className="welcome-hero">
        <h1 className="welcome-title">Task Management</h1>
        <p className="welcome-lead">
          Create projects and tasks, assign them to people in your org, move tasks through todo → done. All data is per-organization.
        </p>
        <ul className="welcome-features">
          {features.map((text, i) => (
            <li key={i} className="welcome-feature-item">
              <span className="welcome-feature-dot" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
        <div className="welcome-actions">
          <Link to="/login" className="btn-primary btn-welcome">Get started</Link>
        </div>
      </div>
    </div>
  )
}
