/**
 * Customer order routes
 */
const express = require('express');
const { getDb } = require('../database/db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { calcVAT, generateOrderNumber } = require('../utils/format');
const { getAllSettings } = require('../models/settings');
const { sendOrderConfirmation } = require('../utils/email');
const { buildWhatsAppUrl, orderStatusMessage } = require('../utils/whatsapp');

const router = express.Router();

const DELIVERY_FEES = { standard: 89, express: 149, collection: 0 };

function getDeliveryFee(type, settings) {
  if (type === 'collection') return 0;
  if (type === 'express') return Number(settings.delivery_express_fee) || 149;
  return Number(settings.delivery_standard_fee) || 89;
}

// Validate promo code
router.post('/validate-promo', (req, res) => {
  const { code, subtotal } = req.body;
  const db = getDb();
  const promo = db.prepare(`
    SELECT * FROM promo_codes WHERE code = ? AND is_active = 1
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    AND (usage_limit IS NULL OR used_count < usage_limit)
  `).get((code || '').toUpperCase());
  if (!promo) return res.status(400).json({ error: 'Invalid or expired promo code' });

  let discount = 0;
  if (promo.type === 'percentage') {
    discount = Math.round(subtotal * (promo.value / 100) * 100) / 100;
  } else {
    discount = Math.min(promo.value, subtotal);
  }
  res.json({ promo, discount });
});

// Create order
router.post('/', optionalAuth, async (req, res) => {
  const {
    items, guest_name, guest_email, guest_phone,
    delivery_type, delivery_address, payment_method, promo_code
  } = req.body;

  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

  const db = getDb();
  const settings = getAllSettings();
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(item.product_id, 'active');
    if (!product) return res.status(400).json({ error: `Product ${item.product_id} not available` });
    const qty = Math.max(1, Number(item.quantity));
    if (product.stock_qty < qty) {
      return res.status(400).json({ error: `${product.name} only has ${product.stock_qty} in stock` });
    }
    const unitPrice = product.sale_price || product.price;
    subtotal += unitPrice * qty;
    orderItems.push({ product, quantity: qty, unit_price: unitPrice });
  }

  let discount = 0;
  let promoId = null;
  if (promo_code) {
    const promo = db.prepare(`
      SELECT * FROM promo_codes WHERE code = ? AND is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(promo_code.toUpperCase());
    if (promo) {
      promoId = promo.id;
      discount = promo.type === 'percentage'
        ? subtotal * (promo.value / 100)
        : Math.min(promo.value, subtotal);
      discount = Math.round(discount * 100) / 100;
    }
  }

  const deliveryFee = getDeliveryFee(delivery_type, settings);
  const afterDiscount = Math.max(0, subtotal - discount);
  const vat = calcVAT(afterDiscount + deliveryFee);
  const total = Math.round((afterDiscount + deliveryFee + vat) * 100) / 100;

  const orderNumber = generateOrderNumber();
  const paymentStatus = payment_method === 'pay_in_store' ? 'pay_in_store' : 'pending';

  // Estimated delivery
  const est = new Date();
  if (delivery_type === 'express') est.setDate(est.getDate() + 1);
  else if (delivery_type === 'collection') est.setDate(est.getDate() + 0);
  else est.setDate(est.getDate() + 4);

  const result = db.prepare(`
    INSERT INTO orders (order_number, user_id, guest_name, guest_email, guest_phone,
      subtotal, delivery_fee, vat, discount, total, delivery_type, delivery_address,
      payment_method, payment_status, promo_code_id, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNumber,
    req.user?.id || null,
    guest_name || req.user?.name,
    guest_email || req.user?.email,
    guest_phone || req.user?.phone,
    subtotal, deliveryFee, vat, discount, total,
    delivery_type, delivery_address || '',
    payment_method, paymentStatus, promoId,
    est.toISOString().slice(0, 10)
  );

  const orderId = result.lastInsertRowid;
  const itemStmt = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const stockStmt = db.prepare('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?');

  const tx = db.transaction(() => {
    orderItems.forEach(({ product, quantity, unit_price }) => {
      itemStmt.run(orderId, product.id, product.name, product.sku, quantity, unit_price);
      stockStmt.run(quantity, product.id);
    });
    if (promoId) {
      db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promoId);
    }
  });
  tx();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const savedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  await sendOrderConfirmation(
    { ...order, user_email: guest_email, user_name: guest_name },
    savedItems
  );

  res.status(201).json({ order, items: savedItems });
});

// Track order (public)
router.post('/track', (req, res) => {
  const { order_number, phone } = req.body;
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(order_number);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const phoneMatch = (order.guest_phone || '').replace(/\D/g, '').includes((phone || '').replace(/\D/g, '').slice(-9));
  if (!phoneMatch) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const whatsapp = buildWhatsAppUrl(null, orderStatusMessage(order.order_number));
  res.json({ order, items, whatsapp_url: whatsapp });
});

// Customer orders
router.get('/my', requireAuth, (req, res) => {
  const db = getDb();
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ orders });
});

router.get('/:orderNumber', requireAuth, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
    .get(req.params.orderNumber, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare(`
    SELECT oi.*, pi.image_url FROM order_items oi
    LEFT JOIN product_images pi ON oi.product_id = pi.product_id AND pi.is_primary = 1
    WHERE oi.order_id = ?
  `).all(order.id);
  res.json({ order, items });
});

module.exports = router;
