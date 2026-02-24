const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, display_name, email, password, favorite_team, favorite_sports } = req.body;

    if (!username || !email || !password || !display_name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];
    const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    db.prepare(`
      INSERT INTO users (id, username, display_name, email, password_hash, favorite_team, favorite_sports, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      username.toLowerCase(),
      display_name,
      email.toLowerCase(),
      password_hash,
      favorite_team || '',
      JSON.stringify(favorite_sports || []),
      color
    );

    const user = db.prepare('SELECT id, username, display_name, email, avatar, bio, verified, verified_type, followers_count, following_count, posts_count, joined_at FROM users WHERE id = ?').get(id);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login.toLowerCase(), login.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, email, avatar, banner, bio, location, website, favorite_team, favorite_sports, verified, verified_type, followers_count, following_count, posts_count, joined_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
