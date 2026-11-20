const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// Calculate status from expiry date
function calculateStatus(expiryDateStr) {
  if (!expiryDateStr) return 'Active';
  const today = new Date('2026-11-20');
  const expiry = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 7) return 'Expiring Soon';
  return 'Active';
}

// GET /api/members
router.get('/', (req, res) => {
  let members = readData('members.json');
  const { search, status, plan } = req.query;

  // Re-evaluate statuses dynamically
  members = members.map(m => ({
    ...m,
    status: calculateStatus(m.expiryDate)
  }));

  if (search) {
    const s = search.toLowerCase().trim();
    members = members.filter(m =>
      (m.name && m.name.toLowerCase().includes(s)) ||
      (m.email && m.email.toLowerCase().includes(s)) ||
      (m.phone && m.phone.includes(s)) ||
      (m.id && m.id.toLowerCase().includes(s))
    );
  }

  if (status && status !== 'all') {
    members = members.filter(m => m.status.toLowerCase() === status.toLowerCase());
  }

  if (plan && plan !== 'all') {
    members = members.filter(m => m.membershipPlan.toLowerCase() === plan.toLowerCase());
  }

  res.json({ success: true, count: members.length, data: members });
});

// GET /api/members/:id
router.get('/:id', (req, res) => {
  const members = readData('members.json');
  const member = members.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }
  member.status = calculateStatus(member.expiryDate);
  res.json({ success: true, data: member });
});

// POST /api/members
router.post('/', (req, res) => {
  const { name, email, phone, age, gender, membershipPlan, startDate, trainer, emergencyContact } = req.body;

  if (!name || !phone || !membershipPlan) {
    return res.status(400).json({ success: false, message: 'Name, phone, and membership plan are required' });
  }

  const members = readData('members.json');
  const memberships = readData('memberships.json');

  // Check phone uniqueness
  const existingPhone = members.find(m => m.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
  if (existingPhone) {
    return res.status(409).json({ success: false, message: 'A member with this phone number already exists' });
  }

  // Calculate start and end date
  const selectedPlan = memberships.find(p => p.name.toLowerCase() === membershipPlan.toLowerCase()) || memberships[0];
  const start = startDate ? new Date(startDate) : new Date('2026-11-20');
  const end = new Date(start);
  end.setDate(end.getDate() + (selectedPlan.durationDays || 30));

  const startFormatted = start.toISOString().split('T')[0];
  const endFormatted = end.toISOString().split('T')[0];

  // Auto-generate ID: FZ-2026-00XX
  const nextNumber = members.length + 1;
  const newId = `FZ-2026-${String(nextNumber).padStart(4, '0')}`;

  const newMember = {
    id: newId,
    name: name.trim(),
    email: email ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    phone: phone.trim(),
    age: Number(age) || 25,
    gender: gender || 'Other',
    joiningDate: startFormatted,
    membershipPlan: selectedPlan.name,
    startDate: startFormatted,
    expiryDate: endFormatted,
    status: calculateStatus(endFormatted),
    trainer: trainer || 'Unassigned',
    emergencyContact: emergencyContact || 'None'
  };

  members.unshift(newMember);
  writeData('members.json', members);

  res.status(201).json({ success: true, message: 'Member registered successfully', data: newMember });
});

// PUT /api/members/:id
router.put('/:id', (req, res) => {
  const members = readData('members.json');
  const index = members.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  const updated = {
    ...members[index],
    ...req.body,
    id: members[index].id // immutable
  };

  if (req.body.expiryDate) {
    updated.status = calculateStatus(req.body.expiryDate);
  }

  members[index] = updated;
  writeData('members.json', members);

  res.json({ success: true, message: 'Member updated successfully', data: updated });
});

// DELETE /api/members/:id
router.delete('/:id', (req, res) => {
  let members = readData('members.json');
  const initialLength = members.length;
  members = members.filter(m => m.id !== req.params.id);

  if (members.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  writeData('members.json', members);
  res.json({ success: true, message: 'Member deleted successfully' });
});

module.exports = router;
