const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const DATA_DIR = path.join(__dirname, '.');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SECRET_KEY = process.env.JWT_SECRET || 'change_this_secret_in_prod';
const PORT = process.env.PORT || 5000;
const COOKIE_NAME = 'token';

function read(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch(e) { return []; }
}
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function validateTaskPayload(payload) {
  const { title, description, dueDate, priority, status } = payload;
  if (!title || typeof title !== 'string' || title.trim().length === 0) return 'Title is required';
  if (priority && !['Low','Medium','High'].includes(priority)) return 'Priority must be Low, Medium or High';
  if (status && !['Pending','In Progress','Completed'].includes(status)) return 'Invalid status';
  return null;
}

function auth(req, res, next) {
  let token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    const header = req.headers.authorization;
    if (header) token = header.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const users = read(USERS_FILE);
  if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, password: hashed };
  users.push(user); write(USERS_FILE, users);
  const payload = { id: user.id, email: user.email };
  setTokenCookie(res, payload);
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const users = read(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const payload = { id: user.id, email: user.email };
  setTokenCookie(res, payload);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

app.get('/api/tasks', auth, (req, res) => {
  const all = read(TASKS_FILE);
  let tasks = all.filter(t => t.userId === req.user.id);
  const { status, priority, q, sortBy, sortDir } = req.query;
  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (q) {
    const ql = q.toLowerCase();
    tasks = tasks.filter(t => (t.title||'').toLowerCase().includes(ql) || (t.description||'').toLowerCase().includes(ql));
  }
  if (sortBy) {
    const dir = sortDir === 'desc' ? -1 : 1;
    tasks.sort((a,b) => {
      if (sortBy === 'dueDate') return (new Date(a.dueDate||0) - new Date(b.dueDate||0)) * dir;
      if (sortBy === 'priority') {
        const map = { 'Low':1,'Medium':2,'High':3 };
        return ( (map[a.priority]||0) - (map[b.priority]||0) ) * dir;
      }
      if (sortBy === 'createdAt') return ( (a.createdAt||0) - (b.createdAt||0) ) * dir;
      return 0;
    });
  }
  res.json(tasks);
});

app.post('/api/tasks', auth, (req, res) => {
  const err = validateTaskPayload(req.body);
  if (err) return res.status(400).json({ message: err });
  const tasks = read(TASKS_FILE);
  const now = Date.now();
  const task = {
    id: now.toString(),
    userId: req.user.id,
    title: String(req.body.title),
    description: req.body.description || '',
    dueDate: req.body.dueDate || null,
    priority: req.body.priority || 'Medium',
    status: req.body.status || 'Pending',
    createdAt: now,
    updatedAt: now
  };
  tasks.push(task); write(TASKS_FILE, tasks);
  res.json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const tasks = read(TASKS_FILE);
  const t = tasks.find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!t) return res.status(404).json({ message: 'Task not found' });
  const err = validateTaskPayload({ title: req.body.title ?? t.title, priority: req.body.priority ?? t.priority, status: req.body.status ?? t.status });
  if (err) return res.status(400).json({ message: err });
  t.title = req.body.title ?? t.title;
  t.description = req.body.description ?? t.description;
  t.dueDate = req.body.dueDate ?? t.dueDate;
  t.priority = req.body.priority ?? t.priority;
  t.status = req.body.status ?? t.status;
  t.updatedAt = Date.now();
  write(TASKS_FILE, tasks);
  res.json(t);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const tasks = read(TASKS_FILE);
  const before = tasks.length;
  const remainder = tasks.filter(x => !(x.id === req.params.id && x.userId === req.user.id));
  if (remainder.length === before) return res.status(404).json({ message: 'Task not found' });
  write(TASKS_FILE, remainder);
  res.json({ message: 'Deleted' });
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`✅ JSON ToDo server running on http://localhost:${PORT}`));
