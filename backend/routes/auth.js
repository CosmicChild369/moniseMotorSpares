/**
 * Customer & admin authentication routes
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDb } = require('../database/db');
const { setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const { sendPasswordReset } = require('../utils/email');

const router = express.Router();

// Register customer
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password required' });
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, 'customer')
  `).run(name, email.toLowerCase(), phone || '', hash);

  const user = db.prepare('SELECT id, name, email, phone, role, address FROM users WHERE id = ?').get(result.lastInsertRowid);
  setAuthCookie(res, user);
  res.status(201).json({ user, message: 'Registration successful' });
});

// Login (customer or admin)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.is_banned) return res.status(403).json({ error: 'Account suspended' });

  setAuthCookie(res, user);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, address: user.address }
  });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link was sent' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString();
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expires, user.id);
  const resetLink = `${process.env.SITE_URL || 'http://localhost:3000'}/pages/reset-password.html?token=${token}`;
  await sendPasswordReset(user.email, resetLink);
  res.json({ message: 'If that email exists, a reset link was sent' });
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  const db = getDb();
  const user = db.prepare(`
    SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')
  `).get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(hash, user.id);
  res.json({ message: 'Password updated successfully' });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  const { name, phone, address } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
    .run(name || req.user.name, phone || req.user.phone, address || '', req.user.id);
  const user = db.prepare('SELECT id, name, email, phone, role, address FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
