const express = require('express');
const router = express.Router();
const { readDb } = require('../utils/db');

// POST /api/auth/login — US06
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');

  res.json({ token, user: payload });
});

module.exports = router;
