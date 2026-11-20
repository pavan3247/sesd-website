const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// Format current time e.g. 05:42 PM
function formatCurrentTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

// GET /api/attendance
router.get('/', (req, res) => {
  let attendance = readData('attendance.json');
  const { date, search } = req.query;

  if (date) {
    attendance = attendance.filter(a => a.date === date);
  }

  if (search) {
    const s = search.toLowerCase().trim();
    attendance = attendance.filter(a =>
      (a.memberName && a.memberName.toLowerCase().includes(s)) ||
      (a.memberId && a.memberId.toLowerCase().includes(s))
    );
  }

  // Summary counts
  const totalRecords = attendance.length;
  const currentlyPresent = attendance.filter(a => a.status === 'Present' || !a.checkOut).length;

  res.json({
    success: true,
    count: totalRecords,
    currentlyPresent,
    data: attendance
  });
});

// POST /api/attendance/check-in
router.post('/check-in', (req, res) => {
  const { memberIdentifier } = req.body; // Can be Member ID (FZ-2026-0001) or Member Name

  if (!memberIdentifier) {
    return res.status(400).json({ success: false, message: 'Please provide a Member ID or Name' });
  }

  const members = readData('members.json');
  const query = memberIdentifier.trim().toLowerCase();

  const member = members.find(m =>
    m.id.toLowerCase() === query ||
    m.name.toLowerCase() === query ||
    m.phone.replace(/\D/g, '') === query.replace(/\D/g, '')
  );

  if (!member) {
    return res.status(404).json({ success: false, message: `No registered member found matching "${memberIdentifier}"` });
  }

  // Check membership expiry
  const today = new Date('2026-11-20');
  const expiry = new Date(member.expiryDate);
  if (expiry < today) {
    return res.status(403).json({
      success: false,
      message: `Access Denied: Membership for ${member.name} (${member.id}) expired on ${member.expiryDate}. Please renew the membership plan to check in.`
    });
  }

  const attendance = readData('attendance.json');
  const todayStr = '2026-11-20';

  // Check if already checked in today and not checked out
  const alreadyCheckedIn = attendance.find(a =>
    a.memberId === member.id &&
    a.date === todayStr &&
    (a.status === 'Present' || !a.checkOut)
  );

  if (alreadyCheckedIn) {
    return res.status(409).json({
      success: false,
      message: `${member.name} is already checked in at ${alreadyCheckedIn.checkIn}`
    });
  }

  const newId = `ATT-${String(attendance.length + 1001)}`;
  const checkInTime = formatCurrentTime();

  const newRecord = {
    id: newId,
    memberId: member.id,
    memberName: member.name,
    date: todayStr,
    checkIn: checkInTime,
    checkOut: null,
    status: 'Present'
  };

  attendance.unshift(newRecord);
  writeData('attendance.json', attendance);

  res.status(201).json({
    success: true,
    message: `Welcome, ${member.name}! Check-in recorded at ${checkInTime}. Plan: ${member.membershipPlan}.`,
    data: newRecord,
    member
  });
});

// POST /api/attendance/check-out/:id
router.post('/check-out/:id', (req, res) => {
  const attendance = readData('attendance.json');
  const record = attendance.find(a => a.id === req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  if (record.status === 'Checked Out' && record.checkOut) {
    return res.status(400).json({ success: false, message: 'Member is already checked out' });
  }

  record.checkOut = formatCurrentTime();
  record.status = 'Checked Out';
  writeData('attendance.json', attendance);

  res.json({
    success: true,
    message: `${record.memberName} checked out successfully at ${record.checkOut}`,
    data: record
  });
});

module.exports = router;
