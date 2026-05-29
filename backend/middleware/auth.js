/**
 * JWT authentication middleware - tokens in httpOnly cookies
 */
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/** Sign JWT and set httpOnly cookie */
function setAuthCookie(res, user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

function clearAuthCookie(res) {
  res.clearCookie('token');
}

/** Require authenticated user (customer or admin) */
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, phone, role, address, is_banned FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.is_banned) {
      return res.status(401).json({ error: 'Invalid or banned account' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth - attaches user if logged in */
function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, phone, role, address FROM users WHERE id = ? AND is_banned = 0').get(decoded.id);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}

/** Admin only: staff or super_admin */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!['staff', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/** Super admin only */
function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
  JWT_SECRET
};
