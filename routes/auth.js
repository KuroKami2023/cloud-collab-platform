const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { createSession, destroySession, requireAuth, SESSION_COOKIE } = require('../middleware/auth');

function generateId() {
  let id = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({
      error: 'Username must be at least 3 characters, password at least 6 characters',
    });
  }

  const existing = db.get('users').find({ username }).value();
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const user = {
    id: generateId(),
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  db.get('users').push(user).write();

  const token = createSession(user);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: { id: user.id, username: user.username },
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = req.db;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.get('users').find({ username }).value();
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createSession(user);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.json({
    message: 'Login successful',
    user: { id: user.id, username: user.username },
  });
});

router.post('/logout', (req, res) => {
  const token = req.cookies && req.cookies[SESSION_COOKIE];
  if (token) {
    destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.userId, username: req.user.username } });
});

module.exports = router;
