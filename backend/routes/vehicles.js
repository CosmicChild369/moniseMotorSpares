/**
 * Vehicle fitment database routes
 */
const express = require('express');
const { getDb } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Years dropdown
router.get('/years', (req, res) => {
  const db = getDb();
  const years = db.prepare('SELECT DISTINCT year FROM vehicles ORDER BY year DESC').all();
  res.json({ years: years.map((y) => y.year) });
});

router.get('/makes', (req, res) => {
  const { year } = req.query;
  const db = getDb();
  let sql = 'SELECT DISTINCT make FROM vehicles';
  const params = [];
  if (year) { sql += ' WHERE year = ?'; params.push(year); }
  sql += ' ORDER BY make';
  const makes = db.prepare(sql).all(...params);
  res.json({ makes: makes.map((m) => m.make) });
});

router.get('/models', (req, res) => {
  const { year, make } = req.query;
  const db = getDb();
  const models = db.prepare('SELECT DISTINCT model FROM vehicles WHERE year = ? AND make = ? ORDER BY model')
    .all(year, make);
  res.json({ models: models.map((m) => m.model) });
});

router.get('/engines', (req, res) => {
  const { year, make, model } = req.query;
  const db = getDb();
  const engines = db.prepare('SELECT id, engine FROM vehicles WHERE year = ? AND make = ? AND model = ? ORDER BY engine')
    .all(year, make, model);
  res.json({ engines });
});

// Resolve vehicle ID
router.get('/resolve', (req, res) => {
  const { year, make, model, engine } = req.query;
  const db = getDb();
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE year = ? AND make = ? AND model = ? AND engine = ?')
    .get(Number(year), make, model, engine);
  res.json({ vehicle: vehicle || null });
});

// User saved vehicles
router.get('/saved', requireAuth, (req, res) => {
  const db = getDb();
  const vehicles = db.prepare(`
    SELECT v.*, uv.nickname FROM vehicles v
    JOIN user_vehicles uv ON v.id = uv.vehicle_id
    WHERE uv.user_id = ?
  `).all(req.user.id);
  res.json({ vehicles });
});

router.post('/saved', requireAuth, (req, res) => {
  const { vehicle_id, nickname } = req.body;
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO user_vehicles (user_id, vehicle_id, nickname) VALUES (?, ?, ?)')
    .run(req.user.id, vehicle_id, nickname || '');
  res.json({ message: 'Vehicle saved' });
});

router.delete('/saved/:vehicleId', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM user_vehicles WHERE user_id = ? AND vehicle_id = ?')
    .run(req.user.id, req.params.vehicleId);
  res.json({ message: 'Vehicle removed' });
});

module.exports = router;
