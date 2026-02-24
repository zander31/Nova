const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sports', require('./routes/sports'));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB and seed on first run
const db = require('./database');
const usersExist = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (usersExist.count === 0) {
  console.log('No users found, running initial seed...');
  const { execSync } = require('child_process');
  try {
    execSync('node seed.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (e) {
    console.error('Seed failed:', e.message);
  }
}

app.listen(PORT, () => {
  console.log(`\n🏆 Sports Twitter API running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
