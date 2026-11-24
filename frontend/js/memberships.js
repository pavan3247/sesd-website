import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
let allPlans = [];
function getFeatures(planOrFeatures) {
    const target = planOrFeatures && typeof planOrFeatures === 'object' && 'features' in planOrFeatures
        ? planOrFeatures.features
        : planOrFeatures;
    if (Array.isArray(target))
        return target;
    if (typeof target === 'string') {
        return target.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    }
    return [];
}
export async function initMemberships() {
    if (!checkAuth())
        return;
    await loadPlans();
    setupEventListeners();
}
export async function loadPlans() {
    try {
        const res = await apiRequest('/memberships');
        if (res.success) {
            allPlans = res.data;
            renderPlansGrid(allPlans);
        }
    }
    catch (err) {
        showToast('Failed to load plans: ' + err.message, 'error');
    }
}
function renderPlansGrid(plans) {
    const container = document.getElementById('plans-grid-container');
    if (!container)
        return;
    container.innerHTML = plans.map(p => {
        const isPopular = p.name === 'Premium' || p.name === 'Standard';
        const popularBadge = isPopular
            ? '<span class="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary-container uppercase tracking-wider shadow-md">Most Popular</span>'
            : '';
        const featuresList = getFeatures(p.features).map(f => `
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
              <span class="font-metric-display text-4xl font-bold text-on-surface">₹${Number(p.price).toLocaleString()}</span>
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
    const addForm = document.getElementById('add-plan-form');
    addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addForm);
        const raw = Object.fromEntries(formData.entries());
        const cleanPayload = {
            name: String(raw.name || '').trim(),
            duration: String(raw.duration || '').trim(),
            durationDays: Number(raw.durationDays) || 30,
            price: Number(raw.price) || 0,
            description: String(raw.description || '').trim(),
            features: getFeatures(raw.features)
        };
        try {
            const res = await apiRequest('/memberships', {
                method: 'POST',
                body: JSON.stringify(cleanPayload)
            });
            if (res.success) {
                showToast('Membership plan created!', 'success');
                addForm.reset();
                window.closeAddModal();
                await loadPlans();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to create plan', 'error');
        }
    });
    const editForm = document.getElementById('edit-plan-form');
    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-plan-id').value;
        const formData = new FormData(editForm);
        const raw = Object.fromEntries(formData.entries());
        const cleanPayload = {
            name: String(raw.name || '').trim(),
            duration: String(raw.duration || '').trim(),
            durationDays: Number(raw.durationDays) || 30,
            price: Number(raw.price) || 0,
            description: String(raw.description || '').trim(),
            features: getFeatures(raw.features)
        };
        try {
            const res = await apiRequest(`/memberships/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cleanPayload)
            });
            if (res.success) {
                showToast('Membership plan updated!', 'success');
                window.closeEditModal();
                await loadPlans();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to update plan', 'error');
        }
    });
}
window.editPlan = (id) => {
    const plan = allPlans.find(p => p.id === id);
    if (!plan)
        return;
    document.getElementById('edit-plan-id').value = plan.id;
    document.getElementById('edit-plan-name').value = plan.name;
    document.getElementById('edit-plan-duration').value = plan.duration;
    document.getElementById('edit-plan-days').value = String(plan.durationDays || 30);
    document.getElementById('edit-plan-price').value = String(plan.price);
    document.getElementById('edit-plan-desc').value = plan.description || '';
    document.getElementById('edit-plan-features').value = getFeatures(plan.features).join('\n');
    document.getElementById('edit-plan-modal')?.classList.remove('hidden');
};
window.deletePlan = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the plan "${name}"?`))
        return;
    try {
        const res = await apiRequest(`/memberships/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast(`Plan "${name}" deleted successfully`, 'success');
            await loadPlans();
        }
    }
    catch (err) {
        showToast(err.message || 'Failed to delete plan', 'error');
    }
};
