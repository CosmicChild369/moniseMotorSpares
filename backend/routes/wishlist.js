/**
 * Customer wishlist routes
 */
const express = require('express');
const { getDb } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT p.*, pi.image_url as primary_image, w.created_at as saved_at
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE w.user_id = ?
  `).all(req.user.id);
  res.json({ items });
});

router.post('/:productId', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)')
    .run(req.user.id, req.params.productId);
  res.json({ message: 'Added to wishlist' });
});

router.delete('/:productId', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?')
    .run(req.user.id, req.params.productId);
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
