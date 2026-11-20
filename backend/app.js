const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/members', require('./routes/members.routes'));
app.use('/api/memberships', require('./routes/memberships.routes'));
app.use('/api/trainers', require('./routes/trainers.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/workouts', require('./routes/workouts.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'FITZONE Gym Membership Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node.js'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
