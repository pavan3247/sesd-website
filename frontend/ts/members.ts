import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
import { Member, MembershipPlan, Trainer } from './types.js';

let allMembers: Member[] = [];
let allPlans: MembershipPlan[] = [];
let allTrainers: Trainer[] = [];

export async function initMembers() {
  if (!checkAuth()) return;

  await Promise.all([loadPlans(), loadTrainers()]);
  await loadMembers();
  setupEventListeners();
}

async function loadPlans() {
  try {
    const res = await apiRequest<{ success: boolean; data: MembershipPlan[] }>('/memberships');
    if (res.success) {
      allPlans = res.data;
      populatePlanDropdowns();
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadTrainers() {
  try {
    const res = await apiRequest<{ success: boolean; data: Trainer[] }>('/trainers');
    if (res.success) {
      allTrainers = res.data;
      populateTrainerDropdowns();
    }
  } catch (e) {
    console.error(e);
  }
}

function populatePlanDropdowns() {
  const planSelects = document.querySelectorAll('.plan-select-dropdown');
  planSelects.forEach((select: any) => {
    select.innerHTML = allPlans.map(p => `<option value="${p.name}">${p.name} (₹${p.price.toLocaleString()} / ${p.duration})</option>`).join('');
  });

  const filterPlanSelect = document.getElementById('filter-plan') as HTMLSelectElement;
  if (filterPlanSelect) {
    filterPlanSelect.innerHTML = '<option value="all">All Plans</option>' + allPlans.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  }
}

function populateTrainerDropdowns() {
  const trainerSelects = document.querySelectorAll('.trainer-select-dropdown');
  trainerSelects.forEach((select: any) => {
    select.innerHTML = '<option value="Unassigned">Unassigned</option>' + allTrainers.map(t => `<option value="${t.name}">${t.name} (${t.specialization})</option>`).join('');
  });
}

export async function loadMembers() {
  const searchInput = (document.getElementById('member-search-input') as HTMLInputElement)?.value || '';
  const statusFilter = (document.getElementById('filter-status') as HTMLSelectElement)?.value || 'all';
  const planFilter = (document.getElementById('filter-plan') as HTMLSelectElement)?.value || 'all';

  const params = new URLSearchParams();
  if (searchInput) params.append('search', searchInput);
  if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
  if (planFilter && planFilter !== 'all') params.append('plan', planFilter);

  try {
    const res = await apiRequest<{ success: boolean; count: number; data: Member[] }>(`/members?${params.toString()}`);
    if (res.success) {
      allMembers = res.data;
      renderMembersTable(allMembers);
    }
  } catch (err: any) {
    showToast('Failed to load members: ' + err.message, 'error');
  }
}

function renderMembersTable(members: Member[]) {
  const tbody = document.getElementById('members-table-tbody');
  const countEl = document.getElementById('members-count-badge');
  if (countEl) countEl.textContent = `${members.length} Athletes`;

  if (!tbody) return;

  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-outline-variant">
          <span class="material-symbols-outlined text-4xl mb-2">person_search</span>
          <p class="text-sm">No members found matching the selected criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = members.map(m => {
    const statusBadge = m.status === 'Active'
      ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary-container/20 text-tertiary">Active</span>'
      : (m.status === 'Expiring Soon'
        ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container/20 text-primary">Expiring</span>'
        : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container/30 text-error">Expired</span>');

    return `
      <tr class="border-b border-surface-container-high/60 hover:bg-surface-container-high/30 transition-colors">
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center font-bold text-sm text-primary">
              ${m.name.charAt(0)}
            </div>
            <div>
              <div class="font-semibold text-sm text-on-surface">${m.name}</div>
              <div class="text-xs text-outline-variant">${m.email}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 font-mono text-xs text-primary font-bold">${m.id}</td>
        <td class="py-3 px-4 text-sm text-on-surface-variant">${m.phone}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-high text-on-surface">${m.membershipPlan}</span>
        </td>
        <td class="py-3 px-4 text-xs text-outline-variant">
          <div>Expires: <span class="font-semibold text-on-surface">${m.expiryDate}</span></div>
          <div class="text-[11px] text-outline">Coach: ${m.trainer || 'None'}</div>
        </td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-right">
          <div class="inline-flex items-center gap-1">
            <button class="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors" title="Edit Member" onclick="window.editMember('${m.id}')">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button class="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors" title="Delete Member" onclick="window.deleteMember('${m.id}', '${m.name}')">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  const searchInput = document.getElementById('member-search-input');
  searchInput?.addEventListener('input', () => loadMembers());

  const statusFilter = document.getElementById('filter-status');
  statusFilter?.addEventListener('change', () => loadMembers());

  const planFilter = document.getElementById('filter-plan');
  planFilter?.addEventListener('change', () => loadMembers());

  // Form Submission
  const addForm = document.getElementById('add-member-form') as HTMLFormElement;
  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await apiRequest('/members', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Member registered successfully!', 'success');
        addForm.reset();
        (window as any).closeAddModal();
        await loadMembers();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to register member', 'error');
    }
  });

  // Edit Form Submission
  const editForm = document.getElementById('edit-member-form') as HTMLFormElement;
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = (document.getElementById('edit-member-id') as HTMLInputElement).value;
    const formData = new FormData(editForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await apiRequest(`/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Member details updated successfully!', 'success');
        (window as any).closeEditModal();
        await loadMembers();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update member', 'error');
    }
  });
}

(window as any).editMember = (id: string) => {
  const member = allMembers.find(m => m.id === id);
  if (!member) return;

  (document.getElementById('edit-member-id') as HTMLInputElement).value = member.id;
  (document.getElementById('edit-name') as HTMLInputElement).value = member.name;
  (document.getElementById('edit-email') as HTMLInputElement).value = member.email;
  (document.getElementById('edit-phone') as HTMLInputElement).value = member.phone;
  (document.getElementById('edit-age') as HTMLInputElement).value = String(member.age || 25);
  (document.getElementById('edit-gender') as HTMLSelectElement).value = member.gender || 'Male';
  (document.getElementById('edit-plan') as HTMLSelectElement).value = member.membershipPlan;
  (document.getElementById('edit-expiry') as HTMLInputElement).value = member.expiryDate;
  (document.getElementById('edit-trainer') as HTMLSelectElement).value = member.trainer || 'Unassigned';
  (document.getElementById('edit-emergency') as HTMLInputElement).value = member.emergencyContact || '';

  const modal = document.getElementById('edit-member-modal');
  modal?.classList.remove('hidden');
};

(window as any).deleteMember = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to permanently delete member ${name} (${id})?`)) {
    return;
  }

  try {
    const res = await apiRequest(`/members/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(`Member ${name} deleted successfully`, 'success');
      await loadMembers();
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to delete member', 'error');
  }
};
