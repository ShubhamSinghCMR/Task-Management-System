import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMe,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  createTask,
  updateTask,
  getOrgUsers,
  getTaskComments,
  addComment,
  getFriendlyErrorMessage,
} from './api'

const PAGE_SIZE = 10

function statusBadge(status) {
  const c = status === 'done' ? 'badge-done' : status === 'in_progress' ? 'badge-progress' : ''
  return <span className={`badge ${c}`}>{status.replace('_', ' ')}</span>
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskCount, setTaskCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [orgUsers, setOrgUsers] = useState([])
  const [newProjectName, setNewProjectName] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [editProjectModal, setEditProjectModal] = useState(null)
  const [editingProjectName, setEditingProjectName] = useState('')
  const [deleteProjectModal, setDeleteProjectModal] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskProjectId, setNewTaskProjectId] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getMe().then((d) => setUser({ ...d })).catch(() => navigate('/login'))
    getOrgUsers().then(setOrgUsers).catch(() => setOrgUsers([]))
  }, [navigate])

  useEffect(() => {
    getProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  function loadTasks(projectId, page = 1) {
    const status = selectedStatus || null
    getTasks(projectId, page, undefined, status)
      .then((data) => {
        setTasks(data.results || [])
        setTaskCount(data.count || 0)
        setCurrentPage(page)
      })
      .catch(() => {
        setTasks([])
        setTaskCount(0)
      })
  }

  useEffect(() => {
    loadTasks(selectedProjectId, 1)
  }, [selectedProjectId, selectedStatus])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 4000)
    return () => clearTimeout(t)
  }, [error])

  function goToPage(page) {
    const status = selectedStatus || null
    getTasks(selectedProjectId, page, undefined, status)
      .then((data) => {
        setTasks(data.results || [])
        setTaskCount(data.count || 0)
        setCurrentPage(page)
      })
      .catch(() => { setTasks([]); setTaskCount(0) })
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    setError('')
    try {
      await createProject(newProjectName)
      setNewProjectName('')
      setShowNewProject(false)
      getProjects().then(setProjects)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to create project')
    }
  }

  function isProjectOwner(project) {
    return user && project.owner === user.id
  }

  function openEditProjectModal(project) {
    setEditProjectModal(project)
    setEditingProjectName(project.name)
  }

  function closeEditProjectModal() {
    setEditProjectModal(null)
    setEditingProjectName('')
  }

  async function handleSaveProject(e) {
    e.preventDefault()
    if (!editProjectModal) return
    setError('')
    try {
      await updateProject(editProjectModal.id, editingProjectName.trim())
      closeEditProjectModal()
      getProjects().then(setProjects)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update project')
    }
  }

  function openDeleteProjectModal(project) {
    setDeleteProjectModal(project)
    setError('')
  }

  function closeDeleteProjectModal() {
    setDeleteProjectModal(null)
  }

  async function handleConfirmDeleteProject() {
    if (!deleteProjectModal) return
    setError('')
    try {
      await deleteProject(deleteProjectModal.id)
      if (selectedProjectId === deleteProjectModal.id) setSelectedProjectId(null)
      closeDeleteProjectModal()
      getProjects().then(setProjects)
      loadTasks(selectedProjectId === deleteProjectModal.id ? null : selectedProjectId, 1)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to delete project')
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault()
    const projectId = newTaskProjectId ? Number(newTaskProjectId) : selectedProjectId
    if (!projectId) return
    setError('')
    try {
      await createTask(
        projectId,
        newTaskTitle,
        'todo',
        newTaskAssignee ? Number(newTaskAssignee) : null
      )
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setNewTaskProjectId('')
      setShowNewTask(false)
      loadTasks(selectedProjectId, currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to create task')
    }
  }

  async function handleMarkDone(task) {
    setError('')
    try {
      await updateTask(task.id, { status: 'done' })
      loadTasks(selectedProjectId, currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update')
    }
  }

  async function handleStatusChange(taskId, value) {
    setError('')
    try {
      await updateTask(taskId, { status: value })
      loadTasks(selectedProjectId, currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update status')
    }
  }

  async function handleAssigneeChange(taskId, value) {
    setError('')
    const assignee = value === '' ? null : Number(value)
    try {
      await updateTask(taskId, { assignee })
      loadTasks(selectedProjectId, currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update assignee')
    }
  }

  function canChangeStatus(task) {
    if (!user) return false
    return task.assignee === user.id || task.project_owner_id === user.id
  }

  async function loadComments(taskId) {
    getTaskComments(taskId).then((data) =>
      setComments((prev) => ({ ...prev, [taskId]: data }))
    )
  }

  function openTask(task) {
    setOpenTaskId(task.id)
    if (!comments[task.id]) loadComments(task.id)
  }

  useEffect(() => {
    if (openTaskId && !comments[openTaskId]) loadComments(openTaskId)
  }, [openTaskId])

  async function handleAddComment(taskId) {
    const body = newComment[taskId]
    if (!body?.trim()) return
    setError('')
    try {
      await addComment(taskId, body.trim())
      setNewComment((prev) => ({ ...prev, [taskId]: '' }))
      loadComments(taskId)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to add comment')
    }
  }

  if (!user) return null

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const totalPages = Math.ceil(taskCount / PAGE_SIZE) || 1

  return (
    <div className="app-container">
      <div className="dashboard-toolbar">
        <button
          type="button"
          className="btn-primary btn-toolbar"
          onClick={() => setShowNewProject(true)}
        >
          + New project
        </button>
        <button
          type="button"
          className="btn-secondary btn-toolbar"
          onClick={() => {
            setShowNewTask(true)
            setNewTaskProjectId(selectedProjectId ? String(selectedProjectId) : '')
          }}
        >
          + New task
        </button>
        <label className="dashboard-filter-label">
          Project
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            className="dashboard-filter-select"
          >
            <option value="">All tasks</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="dashboard-filter-label">
          Status
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="dashboard-filter-select"
          >
            <option value="">All</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        {(selectedProjectId || selectedStatus) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedProjectId(null)
              setSelectedStatus('')
            }}
          >
            Clear filter
          </button>
        )}
      </div>

      {showNewProject && (
        <div className="dialog-overlay" onClick={() => { setShowNewProject(false); setNewProjectName('') }} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">New project</h3>
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
                <button type="button" className="btn-secondary" onClick={() => { setShowNewProject(false); setNewProjectName('') }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewTask && (
        <div className="dialog-overlay" onClick={() => { setShowNewTask(false); setNewTaskTitle(''); setNewTaskAssignee(''); setNewTaskProjectId('') }} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">New task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Project</label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Task title</label>
                <input
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
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
                <button type="button" className="btn-secondary" onClick={() => { setShowNewTask(false); setNewTaskTitle(''); setNewTaskAssignee(''); setNewTaskProjectId('') }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="toast toast-error" role="alert">
          {error}
        </div>
      )}

      {editProjectModal && (
        <div className="dialog-overlay" onClick={closeEditProjectModal} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Edit project</h3>
            <form onSubmit={handleSaveProject}>
              <div className="form-group">
                <label>Project name</label>
                <input
                  type="text"
                  value={editingProjectName}
                  onChange={(e) => setEditingProjectName(e.target.value)}
                  placeholder="Project name"
                  required
                  autoFocus
                />
              </div>
              <div className="dialog-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={closeEditProjectModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteProjectModal && (
        <div className="dialog-overlay" onClick={closeDeleteProjectModal} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Delete project</h3>
            <p className="dialog-message">
              Delete project &quot;{deleteProjectModal.name}&quot;? This will delete all tasks in it.
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-danger" onClick={handleConfirmDeleteProject}>Delete</button>
              <button type="button" className="btn-secondary" onClick={closeDeleteProjectModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-main">
        <div className="card">
          <h2 className="card-title">
            {selectedProject ? `Tasks: ${selectedProject.name}` : 'All tasks'}
          </h2>

          {taskCount === 0 ? (
            <p className="muted-hint" style={{ margin: 0 }}>
              No tasks yet. Use Filters to pick a project and add a task.
            </p>
          ) : (
            <div className="table-card">
              <div className="task-table dashboard-task-table">
                <div className="task-table-header">
                  <span className="task-col-title">Task</span>
                  <span className="task-col-project">Project</span>
                  <span className="task-col-status">Status</span>
                  <span className="task-col-assignee">Assignee</span>
                </div>
                {tasks.map((t) => (
                  <div key={t.id} className="task-table-row">
                    <span className="task-col-title">
                      <button type="button" className="task-title-link" onClick={() => openTask(t)}>
                        {t.title}
                      </button>
                    </span>
                    <span className="task-col-project">
                      {t.project_name ? <span className="task-project-name">{t.project_name}</span> : '—'}
                    </span>
                    <span className="task-col-status">
                      {canChangeStatus(t) ? (
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
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
                    <span className="task-col-assignee task-col-assignee-with-controls">
                      <select
                        value={t.assignee ?? ''}
                        onChange={(e) => handleAssigneeChange(t.id, e.target.value)}
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
                          onClick={() => handleAssigneeChange(t.id, '')}
                          title="Remove assignee"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskCount > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  {taskCount} task{taskCount !== 1 ? 's' : ''} · Page {currentPage} of {totalPages}
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    disabled={totalPages <= 1 || currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    disabled={totalPages <= 1 || currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>

      {openTaskId && (() => {
        const task = tasks.find((t) => t.id === openTaskId)
        if (!task) return null
        return (
          <div className="task-detail-overlay" onClick={() => setOpenTaskId(null)} role="presentation">
            <div className="task-detail-modal card" onClick={(e) => e.stopPropagation()}>
              <div className="task-detail-header">
                <h3 className="task-detail-title">{task.title}</h3>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setOpenTaskId(null)}>Close</button>
              </div>
              <div className="task-detail-meta">
                {task.project_name && <span className="task-project-name">{task.project_name}</span>}
                <span className={`badge ${task.status === 'done' ? 'badge-done' : task.status === 'in_progress' ? 'badge-progress' : ''}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <div className="task-detail-actions">
                {canChangeStatus(task) && (
                  <select
                    value={task.status}
                    onChange={(e) => { handleStatusChange(task.id, e.target.value); setOpenTaskId(null); }}
                    className="task-status-select"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                )}
                <label className="task-assignee-label">
                  Assignee:
                  <select
                    value={task.assignee ?? ''}
                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                    className="task-assignee-select"
                  >
                    <option value="">No assignee</option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="comments-box">
                <h4 className="comments-box-title">Comments</h4>
                <div className="comment-list">
                  {(comments[task.id] || []).map((c) => (
                    <div key={c.id} className="comment-card">
                      <div className="comment-card-header">
                        <span className="comment-author">{c.author_username || c.author}</span>
                        {c.created_at && (
                          <span className="comment-time">
                            {new Date(c.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="comment-body">{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="comment-form-row">
                  <input
                    placeholder="Add a comment..."
                    value={newComment[task.id] || ''}
                    onChange={(e) =>
                      setNewComment((prev) => ({ ...prev, [task.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => handleAddComment(task.id)}
                  >
                    Add comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
