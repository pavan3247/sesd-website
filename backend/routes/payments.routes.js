const express = require('express');
const router = express.Router();
const { readData, writeData } = require('./db');

// GET /api/payments
router.get('/', (req, res) => {
  let payments = readData('payments.json');
  const { search, method } = req.query;

  if (search) {
    const s = search.toLowerCase().trim();
    payments = payments.filter(p =>
      (p.memberName && p.memberName.toLowerCase().includes(s)) ||
      (p.memberId && p.memberId.toLowerCase().includes(s)) ||
      (p.id && p.id.toLowerCase().includes(s)) ||
      (p.reference && p.reference.toLowerCase().includes(s))
    );
  }

  if (method && method !== 'all') {
    payments = payments.filter(p => p.paymentMethod.toLowerCase() === method.toLowerCase());
  }

  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  res.json({
    success: true,
    count: payments.length,
    totalCollected,
    data: payments
  });
});

// POST /api/payments
router.post('/', (req, res) => {
  const { memberId, planName, amount, paymentMethod, reference } = req.body;

  if (!memberId || !amount || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Member ID, amount, and payment method are required' });
  }

  const members = readData('members.json');
  const memberships = readData('memberships.json');
  const payments = readData('payments.json');

  const member = members.find(m => m.id === memberId || m.name.toLowerCase() === memberId.toLowerCase());
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  const selectedPlanName = planName || member.membershipPlan;
  const planObj = memberships.find(p => p.name.toLowerCase() === selectedPlanName.toLowerCase()) || memberships[0];

  const todayStr = '2026-11-20';
  const newId = `PAY-2026-${String(payments.length + 1).padStart(3, '0')}`;

  const defaultRef = paymentMethod === 'UPI'
    ? `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}/HDFC`
    : (paymentMethod === 'Card' ? `POS/CHIP/${Math.floor(1000 + Math.random() * 9000)}` : `CASH-${Date.now().toString().slice(-4)}`);

  const newPayment = {
    id: newId,
    memberId: member.id,
    memberName: member.name,
    membershipPlan: selectedPlanName,
    amount: Number(amount),
    date: todayStr,
    paymentMethod: paymentMethod,
    paymentStatus: 'Paid',
    reference: reference || defaultRef
  };

  payments.unshift(newPayment);
  writeData('payments.json', payments);

  // Renew / extend member membership
  const curExpiry = new Date(member.expiryDate);
  const today = new Date(todayStr);
  let baseDate = curExpiry > today ? curExpiry : today;
  baseDate.setDate(baseDate.getDate() + (planObj.durationDays || 30));

  member.membershipPlan = selectedPlanName;
  member.expiryDate = baseDate.toISOString().split('T')[0];
  member.status = 'Active';

  writeData('members.json', members);

  res.status(201).json({
    success: true,
    message: `Payment of ₹${amount} recorded successfully. Membership updated!`,
    data: newPayment,
    updatedMember: member
  });
});

// GET /api/payments/:id/receipt
router.get('/:id/receipt', (req, res) => {
  const payments = readData('payments.json');
  const payment = payments.find(p => p.id === req.params.id);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }

  const members = readData('members.json');
  const member = members.find(m => m.id === payment.memberId);
  const admin = readData('admin.json');

  const basePrice = Math.round(payment.amount / 1.18);
  const gst = payment.amount - basePrice;

  res.json({
    success: true,
    receipt: {
      receiptNumber: `REC-${payment.id.replace('PAY-', '')}`,
      paymentId: payment.id,
      date: payment.date,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      gym: {
        name: admin.gymName,
        address: admin.address,
        phone: admin.phone,
        gstin: '36AAACF1234F1Z8',
        email: admin.email
      },
      member: {
        id: payment.memberId,
        name: payment.memberName,
        phone: member ? member.phone : 'N/A',
        email: member ? member.email : 'N/A',
        validTill: member ? member.expiryDate : 'N/A'
      },
      lineItems: [
        {
          item: `${payment.membershipPlan} Gym Subscription`,
          baseAmount: basePrice,
          gstRate: '18% (9% CGST + 9% SGST)',
          gstAmount: gst,
          total: payment.amount
        }
      ],
      subTotal: basePrice,
      taxTotal: gst,
      grandTotal: payment.amount,
      authorizedBy: admin.name
    }
  });
});

module.exports = router;
