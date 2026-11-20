import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
import { MembershipPlan } from './types.js';

let allPlans: MembershipPlan[] = [];

export async function initMemberships() {
  if (!checkAuth()) return;
  await loadPlans();
  setupEventListeners();
}

export async function loadPlans() {
  try {
    const res = await apiRequest<{ success: boolean; data: MembershipPlan[] }>('/memberships');
    if (res.success) {
      allPlans = res.data;
      renderPlansGrid(allPlans);
    }
  } catch (err: any) {
    showToast('Failed to load plans: ' + err.message, 'error');
  }
}

function renderPlansGrid(plans: MembershipPlan[]) {
  const container = document.getElementById('plans-grid-container');
  if (!container) return;

  container.innerHTML = plans.map(p => {
    const isPopular = p.name === 'Premium' || p.name === 'Standard';
    const popularBadge = isPopular
      ? '<span class="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary-container uppercase tracking-wider shadow-md">Most Popular</span>'
      : '';

    const featuresList = (p.features || []).map(f => `
      <li class="flex items-start gap-2.5 text-sm text-on-surface-variant">
        <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
        <span>${f}</span>
      </li>
    `).join('');

    return `
      <div class="relative bg-surface-container rounded-2xl p-6 border ${isPopular ? 'border-primary/50 shadow-[0_0_20px_rgba(255,94,20,0.15)]' : 'border-surface-container-high'} flex flex-col justify-between hover:bg-surface-container-high/60 transition-all">
        ${popularBadge}
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-headline-sm text-2xl font-bold text-on-surface">${p.name}</h3>
            <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container-highest text-primary">${p.duration}</span>
          </div>
          <p class="text-xs text-outline-variant mb-6 line-clamp-2">${p.description}</p>
          <div class="mb-6">
            <span class="text-xs text-outline-variant">Starting at</span>
            <div class="flex items-baseline gap-1">
              <span class="font-metric-display text-4xl font-bold text-on-surface">₹${p.price.toLocaleString()}</span>
              <span class="text-xs text-outline-variant">/ ${p.duration}</span>
            </div>
          </div>
          <div class="border-t border-surface-container-high pt-5 mb-6">
            <div class="text-xs font-bold uppercase tracking-wider text-outline mb-3">What's included:</div>
            <ul class="space-y-2.5">
              ${featuresList}
            </ul>
          </div>
        </div>
        <div class="pt-4 border-t border-surface-container-high/60 flex items-center justify-between gap-2">
          <button class="flex-1 py-2.5 px-4 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm font-semibold transition-colors flex items-center justify-center gap-1.5" onclick="window.editPlan('${p.id}')">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            <span>Edit Plan</span>
          </button>
          <button class="p-2.5 rounded-xl text-outline-variant hover:text-error hover:bg-surface-container-highest transition-colors" title="Delete Plan" onclick="window.deletePlan('${p.id}', '${p.name}')">
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setupEventListeners() {
  const addForm = document.getElementById('add-plan-form') as HTMLFormElement;
  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await apiRequest('/memberships', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Membership plan created!', 'success');
        addForm.reset();
        (window as any).closeAddModal();
        await loadPlans();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create plan', 'error');
    }
  });

  const editForm = document.getElementById('edit-plan-form') as HTMLFormElement;
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('edit-plan-id') as HTMLInputElement).value;
    const formData = new FormData(editForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await apiRequest(`/memberships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Membership plan updated!', 'success');
        (window as any).closeEditModal();
        await loadPlans();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'error');
    }
  });
}

(window as any).editPlan = (id: string) => {
  const plan = allPlans.find(p => p.id === id);
  if (!plan) return;

  (document.getElementById('edit-plan-id') as HTMLInputElement).value = plan.id;
  (document.getElementById('edit-plan-name') as HTMLInputElement).value = plan.name;
  (document.getElementById('edit-plan-duration') as HTMLInputElement).value = plan.duration;
  (document.getElementById('edit-plan-days') as HTMLInputElement).value = String(plan.durationDays || 30);
  (document.getElementById('edit-plan-price') as HTMLInputElement).value = String(plan.price);
  (document.getElementById('edit-plan-desc') as HTMLTextAreaElement).value = plan.description;
  (document.getElementById('edit-plan-features') as HTMLTextAreaElement).value = (plan.features || []).join('\n');

  document.getElementById('edit-plan-modal')?.classList.remove('hidden');
};

(window as any).deletePlan = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to delete the plan "${name}"?`)) return;

  try {
    const res = await apiRequest(`/memberships/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(`Plan "${name}" deleted successfully`, 'success');
      await loadPlans();
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to delete plan', 'error');
  }
};
