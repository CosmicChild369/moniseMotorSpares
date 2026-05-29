/**
 * Category routes
 */
const express = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.display_order
  `).all();
  res.json({ categories });
});

router.get('/:slug', (req, res) => {
  const db = getDb();
  const category = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category });
});

module.exports = router;
