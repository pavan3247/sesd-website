const express = require('express');
const router = express.Router();
const { readData } = require('./db');

router.get('/stats', (req, res) => {
  const members = readData('members.json');
  const memberships = readData('memberships.json');
  const trainers = readData('trainers.json');
  const attendance = readData('attendance.json');
  const payments = readData('payments.json');
  const admin = readData('admin.json');

  const todayStr = '2026-11-20'; // Current local system date

  // Metrics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const expiredMembers = members.filter(m => m.status === 'Expired').length;
  const expiringSoon = members.filter(m => m.status === 'Expiring Soon').length;
  const totalTrainers = trainers.length;

  // Monthly Revenue (November 2026)
  const currentMonthPrefix = '2026-11';
  const monthlyRevenue = payments
    .filter(p => p.date && p.date.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Today's attendance
  const todayAttendanceList = attendance.filter(a => a.date === todayStr);
  const todayAttendanceCount = todayAttendanceList.length;
  const insideNowCount = todayAttendanceList.filter(a => a.status === 'Present' || !a.checkOut).length;

  // Revenue chart: last 6 months (June to November 2026)
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  const monthLabels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const revenueChartData = months.map(m => {
    return payments
      .filter(p => p.date && p.date.startsWith(m))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  });

  // Membership growth chart: count of members joined in each of those months
  const growthChartData = months.map(m => {
    return members.filter(mem => mem.joiningDate && mem.joiningDate.startsWith(m)).length;
  });

  // Plan distribution for donut/progress
  const planDistribution = {};
  memberships.forEach(plan => {
    planDistribution[plan.name] = members.filter(m => m.membershipPlan === plan.name).length;
  });

  // Recent data
  const recentRegistrations = [...members].reverse().slice(0, 5);
  const recentPayments = [...payments].reverse().slice(0, 5);
  const recentAttendance = [...attendance].reverse().slice(0, 6);

  res.json({
    success: true,
    data: {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      totalTrainers,
      monthlyRevenue,
      todayAttendanceCount,
      insideNowCount,
      gymCapacity: admin.capacity || 200,
      charts: {
        labels: monthLabels,
        revenue: revenueChartData,
        growth: growthChartData,
        planDistribution
      },
      recentRegistrations,
      recentPayments,
      recentAttendance
    }
  });
});

module.exports = router;
