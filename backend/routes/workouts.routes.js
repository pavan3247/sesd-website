const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// GET /api/workouts
router.get('/', (req, res) => {
  const workouts = readData('workouts.json');
  res.json({ success: true, count: workouts.length, data: workouts });
});

// POST /api/workouts
router.post('/', (req, res) => {
  const { planName, memberName, trainerName, duration, difficulty, targetGoal, exercises } = req.body;

  if (!planName || !memberName || !trainerName) {
    return res.status(400).json({ success: false, message: 'Plan name, athlete name, and trainer name are required' });
  }

  const workouts = readData('workouts.json');
  const members = readData('members.json');
  const member = members.find(m => m.name.toLowerCase() === memberName.toLowerCase());

  const newId = `WK-${String(workouts.length + 1).padStart(3, '0')}`;

  const defaultExercises = [
    { name: 'Barbell Squats', sets: '4', reps: '10', weight: '70 kg', target: 'Quads/Core' },
    { name: 'Dumbbell Bench Press', sets: '3', reps: '12', weight: '22 kg', target: 'Chest' },
    { name: 'Bent-Over Rows', sets: '3', reps: '10', weight: '50 kg', target: 'Lats' }
  ];

  const newPlan = {
    id: newId,
    planName: planName.trim(),
    memberName: memberName.trim(),
    memberId: member ? member.id : 'FZ-2026-NEW',
    trainerName: trainerName.trim(),
    duration: duration || '50 mins',
    difficulty: difficulty || 'Intermediate',
    targetGoal: targetGoal || 'General Strength & Conditioning',
    exercises: Array.isArray(exercises) && exercises.length > 0 ? exercises : defaultExercises
  };

  workouts.unshift(newPlan);
  writeData('workouts.json', workouts);

  res.status(201).json({ success: true, message: 'Workout plan created successfully', data: newPlan });
});

// PUT /api/workouts/:id
router.put('/:id', (req, res) => {
  const workouts = readData('workouts.json');
  const index = workouts.findIndex(w => w.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Workout plan not found' });
  }

  const updated = {
    ...workouts[index],
    ...req.body,
    id: workouts[index].id
  };

  workouts[index] = updated;
  writeData('workouts.json', workouts);

  res.json({ success: true, message: 'Workout plan updated successfully', data: updated });
});

// DELETE /api/workouts/:id
router.delete('/:id', (req, res) => {
  let workouts = readData('workouts.json');
  const initialLength = workouts.length;
  workouts = workouts.filter(w => w.id !== req.params.id);

  if (workouts.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Workout plan not found' });
  }

  writeData('workouts.json', workouts);
  res.json({ success: true, message: 'Workout plan deleted successfully' });
});

module.exports = router;
