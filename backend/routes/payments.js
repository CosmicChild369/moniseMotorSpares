/**
 * PayFast payment integration
 */
const express = require('express');
const { getDb } = require('../database/db');
const { buildPaymentData, verifyNotification } = require('../utils/payfast');
const { getAllSettings } = require('../models/settings');

const router = express.Router();

// Initiate PayFast payment - returns form data for POST
router.post('/payfast/initiate', (req, res) => {
  const { order_number } = req.body;
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(order_number);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: 'Order already paid' });
  }

  const settings = getAllSettings();
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  const paymentData = buildPaymentData(order, siteUrl, settings);
  res.json({ payment: paymentData });
});

// PayFast return URL (customer redirect)
router.get('/payfast/return', (req, res) => {
  const orderNumber = req.query.m_payment_id;
  res.redirect(`/pages/order-success.html?order=${orderNumber}`);
});

// PayFast ITN notify (server-to-server)
router.post('/payfast/notify', express.urlencoded({ extended: false }), (req, res) => {
  const settings = getAllSettings();
  const passphrase = settings.payfast_passphrase || process.env.PAYFAST_PASSPHRASE;

  if (!verifyNotification(req.body, passphrase)) {
    return res.status(400).send('Invalid signature');
  }

  const db = getDb();
  const orderNumber = req.body.m_payment_id;
  const paymentStatus = req.body.payment_status;

  if (paymentStatus === 'COMPLETE') {
    db.prepare(`UPDATE orders SET payment_status = 'paid', payfast_payment_id = ? WHERE order_number = ?`)
      .run(req.body.pf_payment_id, orderNumber);
    db.prepare(`UPDATE orders SET status = 'confirmed' WHERE order_number = ? AND status = 'pending'`)
      .run(orderNumber);
  }

  res.send('OK');
});

module.exports = router;
