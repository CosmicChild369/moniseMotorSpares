/**
 * Invoice download for customers
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { generateInvoicePdf } = require('../utils/pdf');

const router = express.Router();

router.get('/order/:orderNumber', requireAuth, async (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
    .get(req.params.orderNumber, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const settings = db.prepare("SELECT value FROM settings WHERE key = 'invoice_footer'").get();
  const filename = `invoice-${order.order_number}.pdf`;

  const filepath = await generateInvoicePdf({
    orderNumber: order.order_number,
    invoiceNumber: order.order_number,
    customerName: order.guest_name,
    customerEmail: order.guest_email,
    customerPhone: order.guest_phone,
    customerAddress: order.delivery_address,
    items: items.map((i) => ({ ...i, description: i.product_name })),
    subtotal: order.subtotal,
    vat: order.vat,
    total: order.total,
    footer: settings?.value
  }, filename);

  res.download(filepath);
});

module.exports = router;
