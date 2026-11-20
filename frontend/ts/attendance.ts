import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
import { AttendanceRecord } from './types.js';

let attendanceList: AttendanceRecord[] = [];

export async function initAttendance() {
  if (!checkAuth()) return;
  await loadAttendance();
  setupEventListeners();
}

export async function loadAttendance() {
  const dateInput = (document.getElementById('attendance-date-filter') as HTMLInputElement)?.value || '';
  const searchInput = (document.getElementById('attendance-search-input') as HTMLInputElement)?.value || '';

  const params = new URLSearchParams();
  if (dateInput) params.append('date', dateInput);
  if (searchInput) params.append('search', searchInput);

  try {
    const res = await apiRequest<{ success: boolean; count: number; currentlyPresent: number; data: AttendanceRecord[] }>(`/attendance?${params.toString()}`);
    if (res.success) {
      attendanceList = res.data;
      renderAttendanceTable(attendanceList);

      const presentCountEl = document.getElementById('attendance-present-count');
      if (presentCountEl) presentCountEl.textContent = `${res.currentlyPresent} Inside Floor`;

      const totalCountEl = document.getElementById('attendance-total-count');
      if (totalCountEl) totalCountEl.textContent = `${res.count} Entries`;
    }
  } catch (err: any) {
    showToast('Failed to load attendance: ' + err.message, 'error');
  }
}

function renderAttendanceTable(records: AttendanceRecord[]) {
  const tbody = document.getElementById('attendance-table-tbody');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-outline-variant">
          <span class="material-symbols-outlined text-4xl mb-2">fact_check</span>
          <p class="text-sm">No attendance records found for this date.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(r => {
    const isPresent = r.status === 'Present' || !r.checkOut;
    const statusBadge = isPresent
      ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary-container/30 text-tertiary"><span class="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>Present</span>'
      : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-container-highest text-outline-variant">Checked Out</span>';

    const checkOutBtn = isPresent
      ? `<button class="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-xs font-bold text-primary transition-colors flex items-center gap-1" onclick="window.checkOutMember('${r.id}')">
          <span class="material-symbols-outlined text-[16px]">logout</span>
          <span>Check-out</span>
         </button>`
      : `<span class="text-xs text-outline-variant">${r.checkOut}</span>`;

    return `
      <tr class="border-b border-surface-container-high/60 hover:bg-surface-container-high/30 transition-colors">
        <td class="py-3.5 px-4 font-mono text-xs text-outline">${r.id}</td>
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs text-primary">
              ${r.memberName.charAt(0)}
            </div>
            <div>
              <div class="font-semibold text-sm text-on-surface">${r.memberName}</div>
              <div class="text-[11px] text-outline-variant font-mono">${r.memberId}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 text-xs text-on-surface-variant">${r.date}</td>
        <td class="py-3.5 px-4 text-xs font-semibold text-tertiary">${r.checkIn}</td>
        <td class="py-3.5 px-4 text-xs">${statusBadge}</td>
        <td class="py-3.5 px-4 text-right">${checkOutBtn}</td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  const rapidForm = document.getElementById('rapid-checkin-form') as HTMLFormElement;
  rapidForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('rapid-checkin-input') as HTMLInputElement;
    const identifier = input.value.trim();

    if (!identifier) {
      showToast('Please enter a Member ID or Name', 'error');
      return;
    }

    try {
      const res = await apiRequest('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ memberIdentifier: identifier })
      });

      if (res.success) {
        showToast(res.message, 'success');
        input.value = '';
        await loadAttendance();
      }
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    }
  });

  const dateFilter = document.getElementById('attendance-date-filter');
  dateFilter?.addEventListener('change', () => loadAttendance());

  const searchInput = document.getElementById('attendance-search-input');
  searchInput?.addEventListener('input', () => loadAttendance());
}

(window as any).checkOutMember = async (id: string) => {
  try {
    const res = await apiRequest(`/attendance/check-out/${id}`, { method: 'POST' });
    if (res.success) {
      showToast(res.message, 'success');
      await loadAttendance();
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to check-out member', 'error');
  }
};
