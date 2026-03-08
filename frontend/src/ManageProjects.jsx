import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe, getProjects, createProject, updateProject, deleteProject, getTasks, createTask, updateTask, getOrgUsers, getFriendlyErrorMessage } from './api'

export default function ManageProjects() {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [orgUsers, setOrgUsers] = useState([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [editProject, setEditProject] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [deleteProjectItem, setDeleteProjectItem] = useState(null)
  const [openProject, setOpenProject] = useState(null)
  const [projectTasks, setProjectTasks] = useState([])
  const [projectTaskCount, setProjectTaskCount] = useState(0)
  const [projectTasksPage, setProjectTasksPage] = useState(1)
  const [showAddTaskInProject, setShowAddTaskInProject] = useState(false)
  const PROJECT_TASKS_PAGE_SIZE = 5
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getMe().then((d) => setUser(d)).catch(() => navigate('/login'))
  }, [navigate])

  useEffect(() => {
    if (user) {
      getProjects().then(setProjects).catch(() => setProjects([]))
      getOrgUsers().then(setOrgUsers).catch(() => setOrgUsers([]))
    }
  }, [user])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 4000)
    return () => clearTimeout(t)
  }, [error])

  function loadProjectTasks(projectId, page = 1) {
    getTasks(projectId, page, PROJECT_TASKS_PAGE_SIZE)
      .then((data) => {
        setProjectTasks(data.results || [])
        setProjectTaskCount(data.count || 0)
        setProjectTasksPage(page)
      })
      .catch(() => {
        setProjectTasks([])
        setProjectTaskCount(0)
      })
  }

  function openProjectView(p) {
    setOpenProject(p)
    setShowAddTaskInProject(false)
    setNewTaskTitle('')
    setNewTaskAssignee('')
    setProjectTasksPage(1)
    loadProjectTasks(p.id, 1)
  }

  function closeProjectView() {
    setOpenProject(null)
    setProjectTasks([])
    setProjectTaskCount(0)
    setProjectTasksPage(1)
    setShowAddTaskInProject(false)
  }

  async function handleAddTaskToProject(e) {
    e.preventDefault()
    if (!openProject || !newTaskTitle.trim()) return
    setError('')
    try {
      await createTask(openProject.id, newTaskTitle.trim(), 'todo', newTaskAssignee ? Number(newTaskAssignee) : null)
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setShowAddTaskInProject(false)
      loadProjectTasks(openProject.id, projectTasksPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to add task')
    }
  }

  function canChangeTaskStatus(task) {
    return user && (task.assignee === user.id || task.project_owner_id === user.id)
  }

  async function handleProjectTaskStatusChange(taskId, value) {
    if (!openProject) return
    setError('')
    try {
      await updateTask(taskId, { status: value })
      loadProjectTasks(openProject.id, projectTasksPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update status')
    }
  }

  async function handleProjectTaskAssigneeChange(taskId, value) {
    if (!openProject) return
    setError('')
    const assignee = value === '' ? null : Number(value)
    try {
      await updateTask(taskId, { assignee })
      loadProjectTasks(openProject.id, projectTasksPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update assignee')
    }
  }

  function isOwner(p) {
    return user && p.owner === user.id
  }

  function openEditDialog(p) {
    setEditProject(p)
    setEditingName(p.name)
    setError('')
  }

  function closeEditDialog() {
    setEditProject(null)
    setEditingName('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editProject) return
    setError('')
    try {
      await updateProject(editProject.id, editingName.trim())
      closeEditDialog()
      getProjects().then(setProjects)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update')
    }
  }

  function openDeleteDialog(p) {
    setDeleteProjectItem(p)
    setError('')
  }

  function closeDeleteDialog() {
    setDeleteProjectItem(null)
  }

  async function handleConfirmDelete() {
    if (!deleteProjectItem) return
    setError('')
    try {
      await deleteProject(deleteProjectItem.id)
      closeDeleteDialog()
      getProjects().then(setProjects)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to delete')
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    setError('')
    try {
      await createProject(newProjectName.trim())
      setNewProjectName('')
      setShowAddDialog(false)
      getProjects().then(setProjects)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to create project')
    }
  }

  if (!user) return null

  return (
    <div className="app-container">
      <div className="page-header-row">
        <h1 className="page-title">Manage projects</h1>
        <button type="button" className="btn-primary btn-toolbar" onClick={() => setShowAddDialog(true)}>
          + Add project
        </button>
      </div>
      <p className="muted-hint" style={{ marginBottom: '1rem' }}>
        Edit or delete projects you own. Projects with tasks in progress cannot be deleted.
      </p>
      {error && (
        <div className="toast toast-error" role="alert">
          {error}
        </div>
      )}
      {showAddDialog && (
        <div className="dialog-overlay" onClick={() => { setShowAddDialog(false); setNewProjectName('') }} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Add project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project name</label>
                <input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="dialog-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowAddDialog(false); setNewProjectName('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editProject && (
        <div className="dialog-overlay" onClick={closeEditDialog} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Edit project</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Project name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Project name"
                  required
                  autoFocus
                />
              </div>
              <div className="dialog-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={closeEditDialog}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteProjectItem && (
        <div className="dialog-overlay" onClick={closeDeleteDialog} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Delete project</h3>
            <p className="dialog-message">
              Delete project &quot;{deleteProjectItem.name}&quot;? All tasks in it will be deleted.
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-danger" onClick={handleConfirmDelete}>Delete</button>
              <button type="button" className="btn-secondary" onClick={closeDeleteDialog}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {openProject && (
        <div className="dialog-overlay" onClick={closeProjectView} role="presentation">
          <div className="dialog-modal card project-tasks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title-row">
              <h3 className="dialog-title">Project: {openProject.name}</h3>
              <button type="button" className="btn-ghost btn-sm" onClick={closeProjectView}>Close</button>
            </div>
            {projectTasks.length === 0 && !showAddTaskInProject ? (
              <div className="project-no-tasks">
                <p className="dialog-message">No tasks assigned.</p>
                <button type="button" className="btn-primary" onClick={() => setShowAddTaskInProject(true)}>
                  + Add task
                </button>
              </div>
            ) : showAddTaskInProject ? (
              <form onSubmit={handleAddTaskToProject}>
                <div className="form-group">
                  <label>Task title</label>
                  <input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Assignee (optional)</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                  >
                    <option value="">No assignee</option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div className="dialog-actions">
                  <button type="submit" className="btn-primary">Add task</button>
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddTaskInProject(false); setNewTaskTitle(''); setNewTaskAssignee('') }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="project-tasks-toolbar">
                  <button type="button" className="btn-primary btn-sm" onClick={() => setShowAddTaskInProject(true)}>
                    + Add task
                  </button>
                </div>
                <div className="project-task-list">
                  <div className="project-task-header">
                    <span>Task</span>
                    <span>Status</span>
                    <span>Assignee</span>
                  </div>
                  {projectTasks.map((t) => (
                    <div key={t.id} className="project-task-item">
                      <span><strong>{t.title}</strong></span>
                      <span>
                        {canChangeTaskStatus(t) ? (
                          <select
                            value={t.status}
                            onChange={(e) => handleProjectTaskStatusChange(t.id, e.target.value)}
                            className="task-status-select"
                          >
                            <option value="todo">Todo</option>
                            <option value="in_progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                        ) : (
                          <span className={`badge ${t.status === 'done' ? 'badge-done' : t.status === 'in_progress' ? 'badge-progress' : ''}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        )}
                      </span>
                      <span className="project-task-assignee-cell">
                        <select
                          value={t.assignee ?? ''}
                          onChange={(e) => handleProjectTaskAssigneeChange(t.id, e.target.value)}
                          className="task-assignee-select"
                        >
                          <option value="">No assignee</option>
                          {orgUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        {t.assignee && (
                          <button
                            type="button"
                            className="btn-remove-assignee"
                            onClick={() => handleProjectTaskAssigneeChange(t.id, '')}
                            title="Remove assignee"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {projectTaskCount > PROJECT_TASKS_PAGE_SIZE && (
                  <div className="pagination" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span className="pagination-info">
                      {projectTaskCount} task{projectTaskCount !== 1 ? 's' : ''} · Page {projectTasksPage} of {Math.ceil(projectTaskCount / PROJECT_TASKS_PAGE_SIZE) || 1}
                    </span>
                    <div className="pagination-buttons">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        disabled={projectTasksPage <= 1}
                        onClick={() => loadProjectTasks(openProject.id, projectTasksPage - 1)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        disabled={projectTasksPage >= Math.ceil(projectTaskCount / PROJECT_TASKS_PAGE_SIZE)}
                        onClick={() => loadProjectTasks(openProject.id, projectTasksPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <div className="table-card">
        <div className="project-table">
          <div className="project-table-header">
            <span className="project-col-name">Project</span>
            <span className="project-col-actions">Actions</span>
          </div>
          {projects.map((p) => (
            <div key={p.id} className="project-table-row">
              <span className="project-col-name">
                <button type="button" className="project-name-link" onClick={() => openProjectView(p)}>
                  {p.name}
                </button>
              </span>
              <span className="project-col-actions">
                {isOwner(p) ? (
                  <>
                    <button type="button" className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEditDialog(p) }}>Edit</button>
                    <button type="button" className="btn-ghost btn-sm project-delete-btn" onClick={(e) => { e.stopPropagation(); openDeleteDialog(p) }}>Delete</button>
                  </>
                ) : (
                  <span className="muted-hint">Not owner</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
      {projects.length === 0 && <p className="muted-hint">No projects yet. <Link to="/dashboard">Create one from the dashboard</Link>.</p>}
    </div>
  )
}
