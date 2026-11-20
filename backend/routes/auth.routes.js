const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const admin = readData('admin.json');

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (email.trim().toLowerCase() === admin.email.toLowerCase() && password === admin.password) {
    const adminSafe = { ...admin };
    delete adminSafe.password;
    return res.json({
      success: true,
      message: 'Login successful',
      token: 'fitzone-session-token-' + Date.now(),
      admin: adminSafe
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. Please use admin@fitzone.com / Admin@123' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const admin = readData('admin.json');
  const adminSafe = { ...admin };
  delete adminSafe.password;
  res.json({ success: true, admin: adminSafe });
});

// POST /api/auth/change-password
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = readData('admin.json');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  if (currentPassword !== admin.password) {
    return res.status(401).json({ success: false, message: 'Current password does not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  admin.password = newPassword;
  writeData('admin.json', admin);

  res.json({ success: true, message: 'Password updated successfully' });
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
  const { name, phone, gymName, address } = req.body;
  const admin = readData('admin.json');

  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (gymName) admin.gymName = gymName;
  if (address) admin.address = address;

  writeData('admin.json', admin);

  const adminSafe = { ...admin };
  delete adminSafe.password;
  res.json({ success: true, message: 'Profile updated successfully', admin: adminSafe });
});

module.exports = router;
