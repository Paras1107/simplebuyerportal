const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const {
  normalizeEmail,
  validateRegister,
  validateLogin,
} = require('../validation');

const router = express.Router();

function userPublic(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const email = normalizeEmail(req.body.email);
    const name = String(req.body.name).trim();
    const password = req.body.password;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const info = db
      .prepare(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      )
      .run(email, passwordHash, name, 'buyer');

    const user = db
      .prepare('SELECT id, email, name, role FROM users WHERE id = ?')
      .get(info.lastInsertRowid);

    setAuthCookie(res, user);
    return res.status(201).json({ user: userPublic(user) });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const errors = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors.join('; ') });
    }
    const email = normalizeEmail(req.body.email);
    const row = db
      .prepare('SELECT id, email, password_hash, name, role FROM users WHERE email = ?')
      .get(email);

    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(req.body.password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    };
    setAuthCookie(res, user);
    return res.json({ user: userPublic(user) });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT id, email, name, role FROM users WHERE id = ?')
    .get(req.user.id);
  if (!row) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Session invalid' });
  }
  res.json({ user: userPublic(row) });
});

module.exports = router;
