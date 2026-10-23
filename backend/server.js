const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { load, save, uid } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const db = load();

app.use(cors());
app.use(express.json());

/* ---------- helpers ---------- */
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' });
const findCourse = (id) => db.courses.find((c) => c.id === id);
const findEnrollment = (userId, courseId) => db.enrollments.find((e) => e.userId === userId && e.courseId === courseId);
const instructorName = (c) => (db.users.find((u) => u.id === c.instructorId) || {}).name || 'Unknown';

function summary(c) {
  return {
    id: c.id, title: c.title, description: c.description, category: c.category, level: c.level,
    instructor: instructorName(c), lessonCount: c.lessons.length,
    minutes: c.lessons.reduce((s, l) => s + (l.duration || 0), 0),
    students: db.enrollments.filter((e) => e.courseId === c.id).length
  };
}

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'Please log in first.' }) : next();
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = db.users.find((u) => u.id === payload.id);
      if (!req.user && required) return res.status(401).json({ error: 'Account no longer exists.' });
      next();
    } catch {
      if (required) return res.status(401).json({ error: 'Session expired. Please log in again.' });
      next();
    }
  };
}

const onlyInstructor = (req, res, next) =>
  req.user.role === 'instructor' ? next() : res.status(403).json({ error: 'Only instructors can do this.' });

function ownCourse(req, res, next) {
  const course = findCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  if (course.instructorId !== req.user.id) return res.status(403).json({ error: 'You do not own this course.' });
  req.course = course;
  next();
}

/* ---------- health (used by cloud load balancers) ---------- */
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() }));

/* ---------- auth ---------- */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'That email is already registered.' });
  const user = { id: uid(), name: name.trim(), email: email.trim().toLowerCase(), role: role === 'instructor' ? 'instructor' : 'student', password: bcrypt.hashSync(password, 8) };
  db.users.push(user);
  save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/auth/me', auth(), (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------- courses ---------- */
app.get('/api/courses', (req, res) => {
  const { search = '', category = '' } = req.query;
  const s = search.toLowerCase();
  const list = db.courses
    .filter((c) => (!s || c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)) && (!category || c.category === category))
    .map(summary);
  res.json(list);
});

app.get('/api/courses/:id', auth(false), (req, res) => {
  const c = findCourse(req.params.id);
  if (!c) return res.status(404).json({ error: 'Course not found.' });
  const enrollment = req.user ? findEnrollment(req.user.id, c.id) : null;
  const isOwner = req.user && req.user.id === c.instructorId;
  const canView = !!enrollment || isOwner;
  res.json({
    ...summary(c),
    enrolled: !!enrollment,
    isOwner: !!isOwner,
    completed: enrollment ? enrollment.completed : [],
    quizScore: enrollment ? enrollment.quizScore : null,
    quizCount: c.quiz.length,
    lessons: c.lessons.map((l) => ({ id: l.id, title: l.title, duration: l.duration, ...(canView ? { content: l.content } : {}) }))
  });
});

app.post('/api/courses', auth(), onlyInstructor, (req, res) => {
  const { title, description, category, level } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });
  const course = { id: uid(), title: title.trim(), description: description.trim(), category: category || 'General', level: level || 'Beginner', instructorId: req.user.id, lessons: [], quiz: [] };
  db.courses.push(course);
  save();
  res.status(201).json(summary(course));
});

app.delete('/api/courses/:id', auth(), onlyInstructor, ownCourse, (req, res) => {
  db.courses = db.courses.filter((c) => c.id !== req.course.id);
  db.enrollments = db.enrollments.filter((e) => e.courseId !== req.course.id);
  save();
  res.json({ ok: true });
});

app.post('/api/courses/:id/lessons', auth(), onlyInstructor, ownCourse, (req, res) => {
  const { title, content, duration } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Lesson title and content are required.' });
  const lesson = { id: uid(), title: title.trim(), content: content.trim(), duration: Number(duration) || 10 };
  req.course.lessons.push(lesson);
  save();
  res.status(201).json(lesson);
});

app.post('/api/courses/:id/quiz', auth(), onlyInstructor, ownCourse, (req, res) => {
  const { question, options, answer } = req.body || {};
  if (!question || !Array.isArray(options) || options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length)
    return res.status(400).json({ error: 'Provide a question, at least two options and the index of the correct option.' });
  const item = { id: uid(), question: question.trim(), options: options.map(String), answer };
  req.course.quiz.push(item);
  save();
  res.status(201).json({ id: item.id });
});

/* ---------- enrollment and progress ---------- */
app.post('/api/courses/:id/enroll', auth(), (req, res) => {
  const c = findCourse(req.params.id);
  if (!c) return res.status(404).json({ error: 'Course not found.' });
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can enroll.' });
  if (findEnrollment(req.user.id, c.id)) return res.status(409).json({ error: 'You are already enrolled.' });
  db.enrollments.push({ id: uid(), userId: req.user.id, courseId: c.id, completed: [], quizScore: null, enrolledAt: new Date().toISOString() });
  save();
  res.status(201).json({ ok: true });
});

app.get('/api/me/enrollments', auth(), (req, res) => {
  const list = db.enrollments
    .filter((e) => e.userId === req.user.id)
    .map((e) => {
      const c = findCourse(e.courseId);
      if (!c) return null;
      const done = e.completed.filter((id) => c.lessons.some((l) => l.id === id)).length;
      return { ...summary(c), progress: c.lessons.length ? Math.round((done / c.lessons.length) * 100) : 0, quizScore: e.quizScore };
    })
    .filter(Boolean);
  res.json(list);
});

app.post('/api/courses/:id/lessons/:lessonId/complete', auth(), (req, res) => {
  const c = findCourse(req.params.id);
  const e = c && findEnrollment(req.user.id, c.id);
  if (!e) return res.status(403).json({ error: 'Enroll in this course first.' });
  if (!c.lessons.some((l) => l.id === req.params.lessonId)) return res.status(404).json({ error: 'Lesson not found.' });
  if (!e.completed.includes(req.params.lessonId)) e.completed.push(req.params.lessonId);
  save();
  res.json({ completed: e.completed });
});

/* ---------- quiz ---------- */
app.get('/api/courses/:id/quiz', auth(), (req, res) => {
  const c = findCourse(req.params.id);
  if (!c) return res.status(404).json({ error: 'Course not found.' });
  if (!findEnrollment(req.user.id, c.id)) return res.status(403).json({ error: 'Enroll in this course first.' });
  res.json(c.quiz.map(({ id, question, options }) => ({ id, question, options })));
});

app.post('/api/courses/:id/quiz/submit', auth(), (req, res) => {
  const c = findCourse(req.params.id);
  const e = c && findEnrollment(req.user.id, c.id);
  if (!e) return res.status(403).json({ error: 'Enroll in this course first.' });
  const answers = (req.body && req.body.answers) || {};
  const correct = c.quiz.filter((q) => answers[q.id] === q.answer).length;
  const percent = c.quiz.length ? Math.round((correct / c.quiz.length) * 100) : 0;
  e.quizScore = Math.max(e.quizScore || 0, percent);
  save();
  res.json({ correct, total: c.quiz.length, percent, best: e.quizScore, review: c.quiz.map((q) => ({ id: q.id, correctIndex: q.answer })) });
});

/* ---------- instructor ---------- */
app.get('/api/instructor/courses', auth(), onlyInstructor, (req, res) => {
  res.json(db.courses.filter((c) => c.instructorId === req.user.id).map(summary));
});

/* ---------- static: landing site at "/", React app at "/app" ---------- */
const landing = path.join(__dirname, '..', 'landing');
const reactDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(reactDist)) {
  app.use('/app', express.static(reactDist));
  app.get('/app/*', (req, res) => res.sendFile(path.join(reactDist, 'index.html')));
}
app.use(express.static(landing));

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));

app.listen(PORT, () => console.log(`LMS running on http://localhost:${PORT}`));