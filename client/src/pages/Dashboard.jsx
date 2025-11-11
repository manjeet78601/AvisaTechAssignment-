import React, {useEffect, useState} from 'react'
export default function Dashboard(){
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Pending')
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [editing, setEditing] = useState(null)

  // we use cookie-based auth; server sets httpOnly cookie on login/register
  const fetchTasks = async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (q) params.set('q', q)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortDir) params.set('sortDir', sortDir)
    const res = await fetch('http://localhost:5000/api/tasks?'+params.toString(), { credentials:'include' })
    if (res.status===401){ window.location.href = '/login'; return }
    const data = await res.json(); setTasks(data || [])
  }

  useEffect(()=>{ fetchTasks() },[])

  async function addTask(e){ e.preventDefault()
    const payload = { title, description, dueDate, priority, status }
    const res = await fetch('http://localhost:5000/api/tasks', { method:'POST', headers: {'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok){ setTitle(''); setDescription(''); setDueDate(''); setPriority('Medium'); setStatus('Pending'); fetchTasks() } else { alert(data.message || 'Error') }
  }

  async function startEdit(t){ setEditing(t); setTitle(t.title); setDescription(t.description||''); setDueDate(t.dueDate||''); setPriority(t.priority||'Medium'); setStatus(t.status||'Pending') }
  async function saveEdit(e){ e.preventDefault(); if (!editing) return
    const payload = { title, description, dueDate, priority, status }
    const res = await fetch('http://localhost:5000/api/tasks/'+editing.id, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok){ setEditing(null); setTitle(''); setDescription(''); setDueDate(''); fetchTasks() } else { alert(data.message || 'Error') }
  }
  async function cancelEdit(){ setEditing(null); setTitle(''); setDescription(''); setDueDate('') }

  async function toggle(t){ await fetch('http://localhost:5000/api/tasks/'+t.id, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ status: t.status==='Completed' ? 'Pending' : 'Completed' }) }); fetchTasks() }
  async function remove(id){ await fetch('http://localhost:5000/api/tasks/'+id, { method:'DELETE', credentials:'include' }); fetchTasks() }

  return (
    <div>
      <div className="card">
        <h2>{editing ? 'Edit Task' : 'Create Task'}</h2>
        <form onSubmit={editing ? saveEdit : addTask}>
          <div className="form-row">
            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
            <select value={priority} onChange={e=>setPriority(e.target.value)}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option>Pending</option><option>In Progress</option><option>Completed</option>
            </select>
          </div>
          <div className="form-row">
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
            <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" type="submit">{editing ? 'Save' : 'Add Task'}</button>
            {editing && <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Filters</h3>
        <div className="filters">
          <input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option><option>Pending</option><option>In Progress</option><option>Completed</option>
          </select>
          <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
            <option value="">All Priority</option><option>Low</option><option>Medium</option><option>High</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="createdAt">Created</option><option value="dueDate">Due Date</option><option value="priority">Priority</option>
          </select>
          <select value={sortDir} onChange={e=>setSortDir(e.target.value)}>
            <option value="desc">Desc</option><option value="asc">Asc</option>
          </select>
          <button className="btn" onClick={fetchTasks}>Apply</button>
        </div>
      </div>

      <div className="card">
        <h3>Tasks ({tasks.length})</h3>
        <ul className="task-list">
          {tasks.map(t=>(
            <li key={t.id}>
              <input type="checkbox" checked={t.status==='Completed'} onChange={()=>toggle(t)} />
              <div style={{flex:1}}>
                <strong>{t.title}</strong>
                <div className="task-meta">{t.priority} • {t.status} • {t.dueDate || 'No due date'}</div>
                <div>{t.description}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <button className="btn" onClick={()=>startEdit(t)}>Edit</button>
                <button className="btn" onClick={()=>remove(t.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
