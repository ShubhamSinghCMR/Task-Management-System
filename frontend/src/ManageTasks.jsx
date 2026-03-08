import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe, getProjects, getTasks, createTask, updateTask, deleteTask, getOrgUsers, getTaskComments, addComment, getFriendlyErrorMessage } from './api'

const PAGE_SIZE = 10

export default function ManageTasks() {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [orgUsers, setOrgUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskCount, setTaskCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterProjectId, setFilterProjectId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTaskProjectId, setNewTaskProjectId] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [editTask, setEditTask] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteTaskItem, setDeleteTaskItem] = useState(null)
  const [addAssigneeTask, setAddAssigneeTask] = useState(null)
  const [addAssigneeUserId, setAddAssigneeUserId] = useState('')
  const [openTaskId, setOpenTaskId] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState({})
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

  function loadTasks(page = 1) {
    const status = filterStatus || null
    getTasks(filterProjectId, page, undefined, status)
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
    if (user) loadTasks(1)
  }, [user, filterProjectId, filterStatus])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 4000)
    return () => clearTimeout(t)
  }, [error])

  function loadComments(taskId) {
    getTaskComments(taskId).then((data) =>
      setComments((prev) => ({ ...prev, [taskId]: Array.isArray(data) ? data : (data.results || []) }))
    ).catch(() => setComments((prev) => ({ ...prev, [taskId]: [] })))
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

  function openEditDialog(t) {
    setEditTask(t)
    setEditingTitle(t.title)
    setError('')
  }

  function closeEditDialog() {
    setEditTask(null)
    setEditingTitle('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editTask) return
    setError('')
    try {
      await updateTask(editTask.id, { title: editingTitle.trim() })
      closeEditDialog()
      loadTasks(currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update')
    }
  }

  function openDeleteDialog(t) {
    if (t.status === 'in_progress') {
      setError('Cannot delete a task that is in progress. Change its status first.')
      return
    }
    setDeleteTaskItem(t)
    setError('')
  }

  function closeDeleteDialog() {
    setDeleteTaskItem(null)
  }

  function canChangeStatus(task) {
    return user && (task.assignee === user.id || task.project_owner_id === user.id)
  }

  async function handleStatusChange(taskId, value) {
    setError('')
    try {
      await updateTask(taskId, { status: value })
      loadTasks(currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update status')
    }
  }

  async function handleAssigneeChange(taskId, value) {
    setError('')
    const assignee = value === '' ? null : Number(value)
    try {
      await updateTask(taskId, { assignee })
      loadTasks(currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to update assignee')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTaskItem) return
    setError('')
    try {
      await deleteTask(deleteTaskItem.id)
      closeDeleteDialog()
      loadTasks(currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to delete')
    }
  }

  function openAddAssigneeDialog(t) {
    setAddAssigneeTask(t)
    setAddAssigneeUserId('')
    setError('')
  }

  function closeAddAssigneeDialog() {
    setAddAssigneeTask(null)
    setAddAssigneeUserId('')
  }

  async function handleSetAssignee(e) {
    e.preventDefault()
    if (!addAssigneeTask || !addAssigneeUserId) return
    setError('')
    try {
      await updateTask(addAssigneeTask.id, { assignee: Number(addAssigneeUserId) })
      closeAddAssigneeDialog()
      loadTasks(currentPage)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to set assignee')
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault()
    const projectId = newTaskProjectId ? Number(newTaskProjectId) : null
    if (!projectId) return
    setError('')
    try {
      await createTask(projectId, newTaskTitle.trim(), 'todo', newTaskAssignee ? Number(newTaskAssignee) : null)
      setNewTaskProjectId('')
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setShowAddDialog(false)
      loadTasks(1)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message) || 'Failed to create task')
    }
  }

  const totalPages = Math.ceil(taskCount / PAGE_SIZE) || 1

  if (!user) return null

  return (
    <div className="app-container">
      <div className="page-header-row">
        <h1 className="page-title">Manage tasks</h1>
        <button type="button" className="btn-primary btn-toolbar" onClick={() => setShowAddDialog(true)}>
          + Add task
        </button>
      </div>
      <p className="muted-hint" style={{ marginBottom: '1rem' }}>
        Edit or delete tasks. Tasks in progress cannot be deleted until status is changed.
      </p>
      <div className="dashboard-toolbar" style={{ marginBottom: '1rem' }}>
        <label className="dashboard-filter-label">
          Project
          <select
            value={filterProjectId ?? ''}
            onChange={(e) => setFilterProjectId(e.target.value ? Number(e.target.value) : null)}
            className="dashboard-filter-select"
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="dashboard-filter-label">
          Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="dashboard-filter-select"
          >
            <option value="">All</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        {(filterProjectId || filterStatus) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFilterProjectId(null)
              setFilterStatus('')
            }}
          >
            Clear filter
          </button>
        )}
      </div>
      {error && (
        <div className="toast toast-error" role="alert">
          {error}
        </div>
      )}
      {showAddDialog && (
        <div className="dialog-overlay" onClick={() => { setShowAddDialog(false); setNewTaskProjectId(''); setNewTaskTitle(''); setNewTaskAssignee('') }} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Add task</h3>
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
                <button type="button" className="btn-secondary" onClick={() => { setShowAddDialog(false); setNewTaskProjectId(''); setNewTaskTitle(''); setNewTaskAssignee('') }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editTask && (
        <div className="dialog-overlay" onClick={closeEditDialog} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Edit task</h3>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Task title</label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Task title"
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
      {deleteTaskItem && (
        <div className="dialog-overlay" onClick={closeDeleteDialog} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Delete task</h3>
            <p className="dialog-message">
              Delete task &quot;{deleteTaskItem.title}&quot;?
            </p>
            <div className="dialog-actions">
              <button type="button" className="btn-danger" onClick={handleConfirmDelete}>Delete</button>
              <button type="button" className="btn-secondary" onClick={closeDeleteDialog}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {addAssigneeTask && (
        <div className="dialog-overlay" onClick={closeAddAssigneeDialog} role="presentation">
          <div className="dialog-modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Add assignee</h3>
            <p className="dialog-message">Assign &quot;{addAssigneeTask.title}&quot; to:</p>
            <form onSubmit={handleSetAssignee}>
              <div className="form-group">
                <label>User</label>
                <select
                  value={addAssigneeUserId}
                  onChange={(e) => setAddAssigneeUserId(e.target.value)}
                  required
                >
                  <option value="">Select user</option>
                  {orgUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div className="dialog-actions">
                <button type="submit" className="btn-primary">Set assignee</button>
                <button type="button" className="btn-secondary" onClick={closeAddAssigneeDialog}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="table-card">
        <div className="task-table">
          <div className="task-table-header">
            <span className="task-col-title">Task</span>
            <span className="task-col-project">Project</span>
            <span className="task-col-status">Status</span>
            <span className="task-col-assignee">Assignee</span>
            <span className="task-col-actions">Actions</span>
          </div>
          {tasks.map((t) => (
            <div key={t.id} className="task-table-row">
              <span className="task-col-title">
                <button type="button" className="task-title-link" onClick={() => setOpenTaskId(t.id)}>
                  {t.title}
                </button>
              </span>
              <span className="task-col-project">{t.project_name ? <span className="task-project-name">{t.project_name}</span> : '—'}</span>
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
              <span className="task-col-actions">
                <button type="button" className="btn-ghost btn-sm" onClick={() => openEditDialog(t)}>Edit</button>
                <button
                  type="button"
                  className="btn-ghost btn-sm project-delete-btn"
                  onClick={() => openDeleteDialog(t)}
                  disabled={t.status === 'in_progress'}
                  title={t.status === 'in_progress' ? 'Change status first' : 'Delete'}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
      {tasks.length === 0 && <p className="muted-hint">No tasks. <Link to="/dashboard">Create one from the dashboard</Link>.</p>}
      {taskCount > PAGE_SIZE && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <span className="pagination-info">
            {taskCount} task{taskCount !== 1 ? 's' : ''} · Page {currentPage} of {totalPages}
          </span>
          <div className="pagination-buttons">
            <button type="button" className="btn-secondary btn-sm" disabled={currentPage <= 1} onClick={() => loadTasks(currentPage - 1)}>Previous</button>
            <button type="button" className="btn-secondary btn-sm" disabled={currentPage >= totalPages} onClick={() => loadTasks(currentPage + 1)}>Next</button>
          </div>
        </div>
      )}

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