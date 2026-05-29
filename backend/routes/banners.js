/**
 * Homepage banners (public)
 */
const express = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const banners = db.prepare(`
    SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order
  `).all();
  res.json({ banners });
});

module.exports = router;
