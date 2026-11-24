const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// GET /api/memberships
router.get('/', (req, res) => {
  const plans = readData('memberships.json');
  res.json({ success: true, count: plans.length, data: plans });
});

// POST /api/memberships
router.post('/', (req, res) => {
  const { name, duration, durationDays, price, description, features } = req.body;

  if (!name || !price || !duration) {
    return res.status(400).json({ success: false, message: 'Plan name, duration, and price are required' });
  }

  const plans = readData('memberships.json');
  const newId = `PLAN-${String(plans.length + 1).padStart(3, '0')}`;

  const featureList = Array.isArray(features)
    ? features
    : (typeof features === 'string'
        ? features.split(/\r?\n|,/).map(f => f.trim()).filter(Boolean)
        : []);

  const newPlan = {
    id: newId,
    name: name.trim(),
    duration: duration.trim(),
    durationDays: Number(durationDays) || 30,
    price: Number(price),
    description: description ? description.trim() : '',
    features: featureList,
    status: 'Active'
  };

  plans.push(newPlan);
  writeData('memberships.json', plans);

  res.status(201).json({ success: true, message: 'Membership plan created', data: newPlan });
});

// PUT /api/memberships/:id
router.put('/:id', (req, res) => {
  const plans = readData('memberships.json');
  const index = plans.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  const updated = {
    ...plans[index],
    ...req.body,
    id: plans[index].id
  };

  if (req.body.price !== undefined) updated.price = Number(req.body.price);
  if (req.body.durationDays !== undefined) updated.durationDays = Number(req.body.durationDays);

  if (req.body.features !== undefined) {
    updated.features = Array.isArray(req.body.features)
      ? req.body.features
      : (typeof req.body.features === 'string'
          ? req.body.features.split(/\r?\n|,/).map(f => f.trim()).filter(Boolean)
          : []);
  }

  plans[index] = updated;
  writeData('memberships.json', plans);

  res.json({ success: true, message: 'Plan updated successfully', data: updated });
});

// DELETE /api/memberships/:id
router.delete('/:id', (req, res) => {
  let plans = readData('memberships.json');
  const initialLength = plans.length;
  plans = plans.filter(p => p.id !== req.params.id);

  if (plans.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  writeData('memberships.json', plans);
  res.json({ success: true, message: 'Plan deleted successfully' });
});

module.exports = router;
