const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// GET /api/trainers
router.get('/', (req, res) => {
  const trainers = readData('trainers.json');
  res.json({ success: true, count: trainers.length, data: trainers });
});

// POST /api/trainers
router.post('/', (req, res) => {
  const { name, specialization, email, phone, experience, bio } = req.body;

  if (!name || !specialization || !phone) {
    return res.status(400).json({ success: false, message: 'Name, specialization, and phone are required' });
  }

  const trainers = readData('trainers.json');
  const newId = `TR-${String(trainers.length + 1).padStart(3, '0')}`;

  const newTrainer = {
    id: newId,
    name: name.trim(),
    specialization: specialization.trim(),
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@fitzone.com`,
    phone: phone.trim(),
    experience: experience || '3 Years',
    rating: 5.0,
    assignedMembers: [],
    bio: bio || 'Professional certified fitness instructor at FITZONE.',
    status: 'Active'
  };

  trainers.push(newTrainer);
  writeData('trainers.json', trainers);

  res.status(201).json({ success: true, message: 'Trainer added successfully', data: newTrainer });
});

// PUT /api/trainers/:id
router.put('/:id', (req, res) => {
  const trainers = readData('trainers.json');
  const index = trainers.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }

  const updated = {
    ...trainers[index],
    ...req.body,
    id: trainers[index].id
  };

  trainers[index] = updated;
  writeData('trainers.json', trainers);

  res.json({ success: true, message: 'Trainer updated successfully', data: updated });
});

// DELETE /api/trainers/:id
router.delete('/:id', (req, res) => {
  let trainers = readData('trainers.json');
  const initialLength = trainers.length;
  trainers = trainers.filter(t => t.id !== req.params.id);

  if (trainers.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }

  writeData('trainers.json', trainers);
  res.json({ success: true, message: 'Trainer removed successfully' });
});

// POST /api/trainers/:id/assign
router.post('/:id/assign', (req, res) => {
  const { memberName } = req.body;
  if (!memberName) {
    return res.status(400).json({ success: false, message: 'Member name is required' });
  }

  const trainers = readData('trainers.json');
  const trainer = trainers.find(t => t.id === req.params.id);
  if (!trainer) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }

  if (!trainer.assignedMembers.includes(memberName)) {
    trainer.assignedMembers.push(memberName);
    writeData('trainers.json', trainers);
  }

  res.json({ success: true, message: 'Member assigned to trainer', data: trainer });
});

module.exports = router;
