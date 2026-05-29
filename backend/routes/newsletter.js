/**
 * Newsletter signup
 */
const express = require('express');
const { getDb } = require('../database/db');

const router = express.Router();

router.post('/', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const db = getDb();
  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email.toLowerCase());
    res.json({ message: 'Subscribed successfully' });
  } catch {
    res.json({ message: 'Already subscribed' });
  }
});

module.exports = router;
