const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

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
    version: '1.0.0'
  });
});

// Static frontend serving
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback to index.html for unmatched non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found` });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  ⚡ FITZONE Gym Membership Management System API`);
  console.log(`  🌐 Server running at: http://localhost:${PORT}`);
  console.log(`  🎯 UI available at:   http://localhost:${PORT}/dashboard.html`);
  console.log(`  🔑 Demo Admin Login:  admin@fitzone.com / Admin@123`);
  console.log(`=======================================================`);
});
