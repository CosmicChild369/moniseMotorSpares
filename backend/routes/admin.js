/**
 * Admin dashboard API routes
 * Requires staff or super_admin role
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { getDb } = require('../database/db');
const { requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const { uploadProductImages, uploadCsv } = require('../middleware/upload');
const { getAllSettings, setSettings } = require('../models/settings');
const { calcVAT, generateInvoiceNumber } = require('../utils/format');
const { generateInvoicePdf } = require('../utils/pdf');
const { sendInvoiceEmail } = require('../utils/email');

const router = express.Router();
router.use(requireAdmin);

// --- Dashboard ---
router.get('/dashboard', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date(?)`).get(today);
  const monthRevenue = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total FROM orders
    WHERE payment_status IN ('paid', 'pay_in_store') AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get();
  const lowStock = db.prepare(`
    SELECT p.*, pi.image_url FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
    WHERE p.stock_qty <= p.low_stock_threshold AND p.status = 'active'
    LIMIT 10
  `).all();
  const newCustomers = db.prepare(`
    SELECT COUNT(*) as c FROM users WHERE role = 'customer' AND date(created_at) >= date('now', '-7 days')
  `).get();
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all();
  const revenueChart = db.prepare(`
    SELECT date(created_at) as date, SUM(total) as revenue
    FROM orders WHERE payment_status IN ('paid', 'pay_in_store')
    AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at) ORDER BY date
  `).all();

  res.json({
    stats: {
      todayOrders: todayOrders.c,
      monthRevenue: monthRevenue.total,
      lowStockCount: lowStock.length,
      newCustomers: newCustomers.c
    },
    lowStock,
    recentOrders,
    revenueChart
  });
});

// --- Products ---
router.get('/products', (req, res) => {
  const db = getDb();
  const { search, category, status, page = 1, limit = 20 } = req.query;
  let sql = `SELECT p.*, c.name as category_name, pi.image_url
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1 WHERE 1=1`;
  const params = [];
  if (search) { sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const products = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  res.json({ products, total });
});

router.get('/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ?').all(product.id);
  const vehicles = db.prepare('SELECT vehicle_id FROM product_vehicles WHERE product_id = ?').all(product.id);
  res.json({ product, images, vehicle_ids: vehicles.map((v) => v.vehicle_id) });
});

router.post('/products', uploadProductImages, (req, res) => {
  const db = getDb();
  const b = req.body;
  const result = db.prepare(`
    INSERT INTO products (name, brand, sku, category_id, description, specifications, price, sale_price, cost_price,
      stock_qty, low_stock_threshold, status, old_battery_required, quantum_part)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.name, b.brand, b.sku, b.category_id, b.description || '', b.specifications || '',
    Number(b.price), b.sale_price || null, b.cost_price || null,
    Number(b.stock_qty) || 0, Number(b.low_stock_threshold) || 5,
    b.status || 'active', b.old_battery_required ? 1 : 0, b.quantum_part ? 1 : 0
  );
  const pid = result.lastInsertRowid;
  if (req.files?.length) {
    const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)');
    req.files.forEach((f, i) => imgStmt.run(pid, `/uploads/products/${f.filename}`, i === 0 ? 1 : 0));
  }
  if (b.vehicle_ids) {
    const ids = JSON.parse(b.vehicle_ids);
    const pv = db.prepare('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?, ?)');
    ids.forEach((vid) => pv.run(pid, vid));
  }
  res.status(201).json({ id: pid });
});

router.put('/products/:id', uploadProductImages, (req, res) => {
  const db = getDb();
  const b = req.body;
  const id = req.params.id;
  db.prepare(`
    UPDATE products SET name=?, brand=?, sku=?, category_id=?, description=?, specifications=?,
      price=?, sale_price=?, cost_price=?, stock_qty=?, low_stock_threshold=?, status=?,
      old_battery_required=?, quantum_part=? WHERE id=?
  `).run(
    b.name, b.brand, b.sku, b.category_id, b.description, b.specifications,
    Number(b.price), b.sale_price || null, b.cost_price || null,
    Number(b.stock_qty), Number(b.low_stock_threshold), b.status,
    b.old_battery_required ? 1 : 0, b.quantum_part ? 1 : 0, id
  );
  if (req.files?.length) {
    const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 0)');
    req.files.forEach((f) => imgStmt.run(id, `/uploads/products/${f.filename}`));
  }
  if (b.vehicle_ids) {
    db.prepare('DELETE FROM product_vehicles WHERE product_id = ?').run(id);
    JSON.parse(b.vehicle_ids).forEach((vid) => {
      db.prepare('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?, ?)').run(id, vid);
    });
  }
  res.json({ message: 'Updated' });
});

router.delete('/products/:id', (req, res) => {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.post('/products/bulk', (req, res) => {
  const { ids, action, value } = req.body;
  const db = getDb();
  if (action === 'delete') {
    ids.forEach((id) => db.prepare('DELETE FROM products WHERE id = ?').run(id));
  } else if (action === 'status') {
    ids.forEach((id) => db.prepare('UPDATE products SET status = ? WHERE id = ?').run(value, id));
  } else if (action === 'price') {
    ids.forEach((id) => db.prepare('UPDATE products SET price = ? WHERE id = ?').run(Number(value), id));
  }
  res.json({ message: 'Bulk action completed' });
});

router.post('/products/import', uploadCsv, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });
  const content = fs.readFileSync(req.file.path, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO products (name, brand, sku, category_id, price, stock_qty, status)
    VALUES (?, ?, ?, (SELECT id FROM categories WHERE slug = ? LIMIT 1), ?, ?, 'active')
  `);
  let imported = 0;
  records.forEach((r) => {
    try {
      stmt.run(r.name, r.brand, r.sku, r.category || 'engine-parts', Number(r.price), Number(r.stock_qty) || 0);
      imported++;
    } catch (e) { /* skip duplicates */ }
  });
  fs.unlinkSync(req.file.path);
  res.json({ imported, total: records.length });
});

// --- Categories ---
router.get('/categories', (req, res) => {
  res.json({ categories: getDb().prepare('SELECT * FROM categories ORDER BY display_order').all() });
});

router.post('/categories', (req, res) => {
  const { name, slug, icon, is_active, display_order } = req.body;
  const r = getDb().prepare('INSERT INTO categories (name, slug, icon, is_active, display_order) VALUES (?,?,?,?,?)')
    .run(name, slug || name.toLowerCase().replace(/\s+/g, '-'), icon, is_active !== false ? 1 : 0, display_order || 0);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/categories/:id', (req, res) => {
  const { name, slug, icon, banner_image, is_active, display_order } = req.body;
  getDb().prepare('UPDATE categories SET name=?, slug=?, icon=?, banner_image=?, is_active=?, display_order=? WHERE id=?')
    .run(name, slug, icon, banner_image, is_active ? 1 : 0, display_order, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/categories/:id', (req, res) => {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// --- Orders ---
router.get('/orders', (req, res) => {
  const { status, from, to, payment } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (from) { sql += ' AND date(created_at) >= ?'; params.push(from); }
  if (to) { sql += ' AND date(created_at) <= ?'; params.push(to); }
  if (payment) { sql += ' AND payment_method = ?'; params.push(payment); }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  res.json({ orders: getDb().prepare(sql).all(...params) });
});

router.get('/orders/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare(`
    SELECT oi.*, pi.image_url FROM order_items oi
    LEFT JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_primary = 1
    WHERE oi.order_id = ?
  `).all(order.id);
  let customer = null;
  if (order.user_id) customer = db.prepare('SELECT name, email, phone FROM users WHERE id = ?').get(order.user_id);
  res.json({ order, items, customer });
});

router.patch('/orders/:id/status', (req, res) => {
  const { status, internal_notes, notify } = req.body;
  const db = getDb();
  db.prepare('UPDATE orders SET status = ?, internal_notes = COALESCE(?, internal_notes) WHERE id = ?')
    .run(status, internal_notes, req.params.id);
  // notify via WhatsApp link returned to admin
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order, notify });
});

router.get('/orders/export/csv', (req, res) => {
  const orders = getDb().prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const header = 'order_number,status,total,payment_status,created_at\n';
  const rows = orders.map((o) => `${o.order_number},${o.status},${o.total},${o.payment_status},${o.created_at}`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(header + rows);
});

// --- Customers ---
router.get('/customers', (req, res) => {
  const db = getDb();
  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.is_banned, u.created_at,
      COUNT(o.id) as order_count, COALESCE(SUM(o.total), 0) as total_spent
    FROM users u LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.created_at DESC
  `).all();
  res.json({ customers });
});

router.patch('/customers/:id/ban', requireSuperAdmin, (req, res) => {
  const { banned } = req.body;
  getDb().prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(banned ? 1 : 0, req.params.id);
  res.json({ message: banned ? 'Customer banned' : 'Customer unbanned' });
});

// --- Vehicles ---
router.get('/vehicles', (req, res) => {
  res.json({ vehicles: getDb().prepare('SELECT * FROM vehicles ORDER BY year DESC, make, model').all() });
});

router.post('/vehicles', (req, res) => {
  const { year, make, model, engine } = req.body;
  const r = getDb().prepare('INSERT INTO vehicles (year, make, model, engine) VALUES (?,?,?,?)').run(year, make, model, engine);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.delete('/vehicles/:id', (req, res) => {
  getDb().prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.post('/vehicles/import', uploadCsv, (req, res) => {
  const content = fs.readFileSync(req.file.path, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  const stmt = getDb().prepare('INSERT OR IGNORE INTO vehicles (year, make, model, engine) VALUES (?,?,?,?)');
  records.forEach((r) => stmt.run(Number(r.year), r.make, r.model, r.engine));
  fs.unlinkSync(req.file.path);
  res.json({ imported: records.length });
});

// --- Promotions ---
router.get('/promos', (req, res) => {
  res.json({ promos: getDb().prepare('SELECT * FROM promo_codes ORDER BY id DESC').all() });
});

router.post('/promos', (req, res) => {
  const { code, type, value, usage_limit, expires_at } = req.body;
  const r = getDb().prepare('INSERT INTO promo_codes (code, type, value, usage_limit, expires_at) VALUES (?,?,?,?,?)')
    .run(code.toUpperCase(), type, value, usage_limit, expires_at);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.get('/banners', (req, res) => {
  res.json({ banners: getDb().prepare('SELECT * FROM banners ORDER BY display_order').all() });
});

router.post('/banners', (req, res) => {
  const { image_url, link, title, display_order } = req.body;
  const r = getDb().prepare('INSERT INTO banners (image_url, link, title, display_order) VALUES (?,?,?,?)')
    .run(image_url, link, title, display_order || 0);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put('/banners/:id', (req, res) => {
  const b = req.body;
  getDb().prepare('UPDATE banners SET image_url=?, link=?, title=?, is_active=?, display_order=? WHERE id=?')
    .run(b.image_url, b.link, b.title, b.is_active ? 1 : 0, b.display_order, req.params.id);
  res.json({ message: 'Updated' });
});

router.post('/products/:id/daily-special', (req, res) => {
  const { is_special, ends_at } = req.body;
  getDb().prepare('UPDATE products SET is_daily_special = ?, special_ends_at = ? WHERE id = ?')
    .run(is_special ? 1 : 0, ends_at, req.params.id);
  res.json({ message: 'Updated' });
});

// --- Invoices / Quotes ---
router.get('/invoices', (req, res) => {
  res.json({ invoices: getDb().prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() });
});

router.post('/invoices', async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, items, notes, payment_terms } = req.body;
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vat = calcVAT(subtotal);
  const total = subtotal + vat;
  const invoiceNumber = generateInvoiceNumber();
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_name, customer_email, customer_phone, customer_address,
      subtotal, vat, total, notes, payment_terms) VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(invoiceNumber, customer_name, customer_email, customer_phone, customer_address, subtotal, vat, total, notes, payment_terms);
  const invId = r.lastInsertRowid;
  const itemStmt = db.prepare('INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  items.forEach((i) => itemStmt.run(invId, i.product_id, i.description, i.quantity, i.unit_price));

  const filename = `${invoiceNumber}.pdf`;
  const pdfPath = await generateInvoicePdf({
    invoiceNumber, customerName: customer_name, customerEmail: customer_email,
    customerPhone: customer_phone, customerAddress: customer_address,
    items, subtotal, vat, total, notes
  }, filename);
  db.prepare('UPDATE invoices SET pdf_path = ? WHERE id = ?').run(pdfPath, invId);
  res.status(201).json({ id: invId, invoice_number: invoiceNumber, pdf_path: pdfPath });
});

router.post('/invoices/:id/send', async (req, res) => {
  const inv = getDb().prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  await sendInvoiceEmail(inv.customer_email, inv.invoice_number, inv.pdf_path);
  getDb().prepare("UPDATE invoices SET status = 'sent' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Invoice sent' });
});

// --- Reports ---
router.get('/reports/sales', (req, res) => {
  const { from, to } = req.query;
  const sales = getDb().prepare(`
    SELECT date(created_at) as date, COUNT(*) as orders, SUM(total) as revenue
    FROM orders WHERE payment_status IN ('paid', 'pay_in_store')
    AND date(created_at) BETWEEN ? AND ? GROUP BY date(created_at)
  `).all(from || '2020-01-01', to || '2099-12-31');
  res.json({ sales });
});

router.get('/reports/top-products', (req, res) => {
  const top = getDb().prepare(`
    SELECT product_name, product_sku, SUM(quantity) as qty, SUM(quantity * unit_price) as revenue
    FROM order_items GROUP BY product_id ORDER BY qty DESC LIMIT 20
  `).all();
  res.json({ top });
});

router.get('/reports/by-category', (req, res) => {
  const data = getDb().prepare(`
    SELECT c.name, SUM(oi.quantity * oi.unit_price) as revenue
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id GROUP BY c.id
  `).all();
  res.json({ data });
});

// --- Settings ---
router.get('/settings', (req, res) => {
  res.json({ settings: getAllSettings() });
});

router.put('/settings', requireSuperAdmin, (req, res) => {
  setSettings(req.body);
  res.json({ message: 'Settings saved' });
});

module.exports = router;
