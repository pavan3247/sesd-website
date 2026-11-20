const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Static frontend serving for local execution
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found` });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  ⚡ FITZONE Gym Membership Management System API`);
  console.log(`  🌐 Server running at: http://localhost:${PORT}`);
  console.log(`  🎯 UI available at:   http://localhost:${PORT}/dashboard.html`);
  console.log(`  🔑 Demo Admin Login:  admin@fitzone.com / Admin@123`);
  console.log(`=======================================================`);
});
