/**
 * Public product catalog routes
 */
const express = require('express');
const { getDb } = require('../database/db');
const { optionalAuth } = require('../middleware/auth');
const { buildWhatsAppUrl, productEnquiryMessage } = require('../utils/whatsapp');
const { getSetting } = require('../models/settings');

const router = express.Router();

function enrichProduct(p, db) {
  const images = db.prepare('SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC').all(p.id);
  const vehicles = db.prepare(`
    SELECT v.id, v.year, v.make, v.model, v.engine
    FROM vehicles v JOIN product_vehicles pv ON v.id = pv.vehicle_id
    WHERE pv.product_id = ?
  `).all(p.id);
  const category = db.prepare('SELECT name, slug FROM categories WHERE id = ?').get(p.category_id);
  return { ...p, images, vehicles, category };
}

// List products with filters
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const {
    page = 1, limit = 12, category, brand, minPrice, maxPrice,
    inStock, vehicleId, year, make, model, engine, sort = 'newest',
    search, quantum, dailySpecial, featured
  } = req.query;

  let sql = `
    SELECT DISTINCT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_vehicles pv ON p.id = pv.product_id
    WHERE p.status = 'active'
  `;
  const params = [];

  if (category) {
    sql += ' AND c.slug = ?';
    params.push(category);
  }
  if (brand) {
    sql += ' AND p.brand = ?';
    params.push(brand);
  }
  if (minPrice) {
    sql += ' AND COALESCE(p.sale_price, p.price) >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND COALESCE(p.sale_price, p.price) <= ?';
    params.push(Number(maxPrice));
  }
  if (inStock === 'true') {
    sql += ' AND p.stock_qty > 0';
  }
  if (vehicleId) {
    sql += ' AND pv.vehicle_id = ?';
    params.push(Number(vehicleId));
  }
  if (year && make && model) {
    sql += ` AND pv.vehicle_id IN (
      SELECT id FROM vehicles WHERE year = ? AND make = ? AND model = ?
      ${engine ? 'AND engine = ?' : ''}
    )`;
    params.push(Number(year), make, model);
    if (engine) params.push(engine);
  }
  if (search) {
    sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (quantum === 'true') sql += ' AND p.quantum_part = 1';
  if (dailySpecial === 'true') sql += ' AND p.is_daily_special = 1';

  const sortMap = {
    'price-asc': 'COALESCE(p.sale_price, p.price) ASC',
    'price-desc': 'COALESCE(p.sale_price, p.price) DESC',
    newest: 'p.created_at DESC',
    rating: 'p.rating_avg DESC'
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.newest}`;

  const countSql = sql.replace(/SELECT DISTINCT p\.\*, c\.name as category_name, c\.slug as category_slug/, 'SELECT COUNT(DISTINCT p.id) as total');
  const { total } = db.prepare(countSql).get(...params) || { total: 0 };

  const offset = (Number(page) - 1) * Number(limit);
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const products = db.prepare(sql).all(...params).map((p) => {
    const img = db.prepare('SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1').get(p.id);
    return { ...p, primary_image: img?.image_url || '/uploads/placeholder-product.svg' };
  });

  res.json({ products, total, page: Number(page), limit: Number(limit) });
});

// Brands list
router.get('/brands', (req, res) => {
  const db = getDb();
  const brands = db.prepare('SELECT DISTINCT brand FROM products WHERE status = ? ORDER BY brand').all('active');
  res.json({ brands: brands.map((b) => b.brand) });
});

// Daily specials
router.get('/specials/today', (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, pi.image_url as primary_image
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE p.is_daily_special = 1 AND p.status = 'active'
    LIMIT 8
  `).all();
  res.json({ products, resetsAt: getMidnightISO() });
});

function getMidnightISO() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.toISOString();
}

// Featured products
router.get('/featured', (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, pi.image_url as primary_image
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE p.status = 'active' AND p.stock_qty > 0
    ORDER BY p.rating_avg DESC LIMIT 8
  `).all();
  res.json({ products });
});

// Single product
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const product = enrichProduct(p, db);
  const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 20').all(p.id);
  const related = db.prepare(`
    SELECT p.*, pi.image_url as primary_image FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE p.category_id = ? AND p.id != ? AND p.status = 'active' LIMIT 4
  `).all(p.category_id, p.id);

  const whatsapp = getSetting('whatsapp_number', process.env.WHATSAPP_NUMBER);
  product.whatsapp_url = buildWhatsAppUrl(whatsapp, productEnquiryMessage(product));

  res.json({ product, reviews, related });
});

module.exports = router;
