/**
 * Monise Motor Spares - Main server
 * Katlehong automotive spares e-commerce
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { getDb } = require('./backend/database/db');

// Initialize database
getDb();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
app.use('/admin/js', express.static(path.join(__dirname, 'frontend/admin/js')));
app.use('/public', express.static(path.join(__dirname, 'frontend/public')));

// API routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/products', require('./backend/routes/products'));
app.use('/api/categories', require('./backend/routes/categories'));
app.use('/api/vehicles', require('./backend/routes/vehicles'));
app.use('/api/orders', require('./backend/routes/orders'));
app.use('/api/payments', require('./backend/routes/payments'));
app.use('/api/wishlist', require('./backend/routes/wishlist'));
app.use('/api/banners', require('./backend/routes/banners'));
app.use('/api/newsletter', require('./backend/routes/newsletter'));
app.use('/api/invoices', require('./backend/routes/invoices'));
app.use('/api/admin', require('./backend/routes/admin'));

// Serve customer pages
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));
// Serve admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'frontend/admin')));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/pages/index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', shop: 'Monise Motor Spares' });
});

// 404 for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Monise Motor Spares running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin/`);
});
