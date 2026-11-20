import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
let revenueChartInstance = null;
let growthChartInstance = null;
export async function initDashboard() {
    if (!checkAuth())
        return;
    try {
        const res = await apiRequest('/dashboard/stats');
        if (res.success && res.data) {
            renderMetrics(res.data);
            renderCharts(res.data.charts);
            renderRecentTables(res.data);
            updateCapacityWidget(res.data.insideNowCount, res.data.gymCapacity);
        }
    }
    catch (err) {
        showToast('Failed to load dashboard data: ' + err.message, 'error');
    }
}
function renderMetrics(stats) {
    // Total Members
    const totalMemEl = document.getElementById('stat-total-members');
    if (totalMemEl)
        totalMemEl.textContent = stats.totalMembers.toLocaleString();
    // Active Members
    const activeMemEl = document.getElementById('stat-active-members');
    if (activeMemEl)
        activeMemEl.textContent = stats.activeMembers.toLocaleString();
    // Expired / Expiring
    const expiredMemEl = document.getElementById('stat-expired-members');
    if (expiredMemEl)
        expiredMemEl.textContent = stats.expiredMembers.toLocaleString();
    const expiringBadgeEl = document.getElementById('stat-expiring-soon');
    if (expiringBadgeEl)
        expiringBadgeEl.textContent = `${stats.expiringSoon} urgent (<7d)`;
    // Total Trainers
    const trainersEl = document.getElementById('stat-total-trainers');
    if (trainersEl)
        trainersEl.textContent = stats.totalTrainers.toLocaleString();
    // Monthly Revenue
    const revEl = document.getElementById('stat-monthly-revenue');
    if (revEl)
        revEl.textContent = `₹${stats.monthlyRevenue.toLocaleString()}`;
    // Today Attendance
    const attEl = document.getElementById('stat-today-attendance');
    if (attEl)
        attEl.textContent = stats.todayAttendanceCount.toLocaleString();
    const insideEl = document.getElementById('stat-inside-now');
    if (insideEl)
        insideEl.textContent = `${stats.insideNowCount} athletes inside now`;
}
function updateCapacityWidget(insideCount, capacity) {
    const cap = capacity || 200;
    const pct = Math.min(100, Math.round((insideCount / cap) * 100));
    const pctEls = document.querySelectorAll('.sidebar-capacity-pct');
    pctEls.forEach(el => el.textContent = `${pct}%`);
    const barEls = document.querySelectorAll('.sidebar-capacity-bar');
    barEls.forEach((el) => el.style.width = `${pct}%`);
    const textEls = document.querySelectorAll('.sidebar-capacity-text');
    textEls.forEach(el => el.textContent = `${insideCount} / ${cap} Inside`);
}
function renderCharts(charts) {
    const revCtx = document.getElementById('revenueChart');
    const growthCtx = document.getElementById('growthChart');
    if (revCtx && window.Chart) {
        if (revenueChartInstance)
            revenueChartInstance.destroy();
        const Chart = window.Chart;
        const ctx = revCtx.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 94, 20, 0.45)');
        gradient.addColorStop(1, 'rgba(255, 94, 20, 0.0)');
        revenueChartInstance = new Chart(revCtx, {
            type: 'line',
            data: {
                labels: charts.labels,
                datasets: [{
                        label: 'Revenue (₹)',
                        data: charts.revenue,
                        borderColor: '#ff5e14',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ff5e14',
                        pointBorderColor: '#10131a',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1d2026',
                        titleColor: '#e1e2eb',
                        bodyColor: '#ffb59b',
                        borderColor: '#32353c',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Revenue: ₹${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#272a31' },
                        ticks: { color: '#aa897e' }
                    },
                    y: {
                        grid: { color: '#272a31' },
                        ticks: {
                            color: '#aa897e',
                            callback: (val) => '₹' + Number(val).toLocaleString()
                        }
                    }
                }
            }
        });
    }
    if (growthCtx && window.Chart) {
        if (growthChartInstance)
            growthChartInstance.destroy();
        const Chart = window.Chart;
        growthChartInstance = new Chart(growthCtx, {
            type: 'bar',
            data: {
                labels: charts.labels,
                datasets: [{
                        label: 'New Joiners',
                        data: charts.growth,
                        backgroundColor: '#4edea3',
                        hoverBackgroundColor: '#6ffbbe',
                        borderRadius: 6
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1d2026',
                        titleColor: '#e1e2eb',
                        bodyColor: '#4edea3',
                        borderColor: '#32353c',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#aa897e' }
                    },
                    y: {
                        grid: { color: '#272a31' },
                        ticks: { color: '#aa897e', stepSize: 1 }
                    }
                }
            }
        });
    }
}
function renderRecentTables(stats) {
    // Recent Registrations
    const regTbody = document.getElementById('recent-registrations-tbody');
    if (regTbody) {
        regTbody.innerHTML = stats.recentRegistrations.map(m => {
            const statusBadge = m.status === 'Active'
                ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-tertiary-container/20 text-tertiary">Active</span>'
                : (m.status === 'Expiring Soon'
                    ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-container/20 text-primary">Expiring</span>'
                    : '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-error-container/30 text-error">Expired</span>');
            return `
        <tr class="border-b border-surface-container-high/60 hover:bg-surface-container-high/40 transition-colors">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs text-primary">
                ${m.name.charAt(0)}
              </div>
              <div>
                <div class="font-semibold text-sm text-on-surface">${m.name}</div>
                <div class="text-xs text-outline-variant">${m.id} • ${m.phone}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 font-body-sm text-sm text-on-surface-variant">${m.membershipPlan}</td>
          <td class="py-3 px-4 font-body-sm text-sm text-outline-variant">${m.joiningDate}</td>
          <td class="py-3 px-4">${statusBadge}</td>
        </tr>
      `;
        }).join('');
    }
    // Recent Payments
    const payTbody = document.getElementById('recent-payments-tbody');
    if (payTbody) {
        payTbody.innerHTML = stats.recentPayments.map(p => {
            return `
        <tr class="border-b border-surface-container-high/60 hover:bg-surface-container-high/40 transition-colors">
          <td class="py-3 px-4">
            <div class="font-semibold text-sm text-on-surface">${p.memberName}</div>
            <div class="text-xs text-outline-variant">${p.id}</div>
          </td>
          <td class="py-3 px-4 text-sm font-bold text-primary">₹${p.amount.toLocaleString()}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded text-xs bg-surface-container-highest text-on-surface">${p.paymentMethod}</span>
          </td>
          <td class="py-3 px-4 text-xs text-outline-variant">${p.date}</td>
        </tr>
      `;
        }).join('');
    }
}
