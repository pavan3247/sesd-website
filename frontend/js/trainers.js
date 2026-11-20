import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
let allTrainers = [];
let allMembers = [];
export async function initTrainers() {
    if (!checkAuth())
        return;
    await Promise.all([loadTrainers(), loadMembersList()]);
    setupEventListeners();
}
async function loadMembersList() {
    try {
        const res = await apiRequest('/members');
        if (res.success) {
            allMembers = res.data;
            populateMemberSelect();
        }
    }
    catch (e) {
        console.error(e);
    }
}
function populateMemberSelect() {
    const select = document.getElementById('assign-member-select');
    if (select) {
        select.innerHTML = allMembers.map(m => `<option value="${m.name}">${m.name} (${m.id})</option>`).join('');
    }
}
export async function loadTrainers() {
    try {
        const res = await apiRequest('/trainers');
        if (res.success) {
            allTrainers = res.data;
            renderTrainersGrid(allTrainers);
        }
    }
    catch (err) {
        showToast('Failed to load trainers: ' + err.message, 'error');
    }
}
function renderTrainersGrid(trainers) {
    const container = document.getElementById('trainers-grid-container');
    const countEl = document.getElementById('trainers-count-badge');
    if (countEl)
        countEl.textContent = `${trainers.length} Active Coaches`;
    if (!container)
        return;
    container.innerHTML = trainers.map(t => {
        const memberChips = (t.assignedMembers || []).slice(0, 4).map(m => `
      <span class="px-2 py-0.5 rounded text-[11px] bg-surface-container-highest text-on-surface">${m}</span>
    `).join('');
        const moreCount = (t.assignedMembers || []).length > 4 ? `+${(t.assignedMembers || []).length - 4} more` : '';
        return `
      <div class="bg-surface-container rounded-2xl p-6 border border-surface-container-high hover:bg-surface-container-high/40 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center font-bold text-lg text-primary">
                ${t.name.charAt(0)}
              </div>
              <div>
                <h3 class="font-headline-sm text-lg font-bold text-on-surface">${t.name}</h3>
                <div class="text-xs text-primary font-medium">${t.specialization}</div>
              </div>
            </div>
            <div class="flex items-center gap-1 text-xs font-bold text-amber-400 bg-surface-container-highest px-2 py-1 rounded-md">
              <span class="material-symbols-outlined text-[14px]">star</span>
              <span>${t.rating || '4.9'}</span>
            </div>
          </div>

          <p class="text-xs text-outline-variant mb-4 line-clamp-2">${t.bio || 'Elite fitness coach at FITZONE.'}</p>

          <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-high mb-4 text-xs">
            <div>
              <span class="text-outline-variant block">Experience</span>
              <span class="font-bold text-on-surface">${t.experience}</span>
            </div>
            <div>
              <span class="text-outline-variant block">Athletes</span>
              <span class="font-bold text-tertiary">${(t.assignedMembers || []).length} Assigned</span>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Assigned Athletes:</div>
            <div class="flex flex-wrap gap-1.5 items-center">
              ${memberChips || '<span class="text-xs text-outline-variant">None assigned</span>'}
              ${moreCount ? `<span class="text-[11px] text-outline font-medium">${moreCount}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-surface-container-high flex items-center justify-between gap-2">
          <button class="flex-1 py-2 px-3 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold transition-colors flex items-center justify-center gap-1" onclick="window.openAssignModal('${t.id}', '${t.name}')">
            <span class="material-symbols-outlined text-[16px]">person_add</span>
            <span>Assign Athlete</span>
          </button>
          <button class="p-2 rounded-lg bg-surface-container-highest text-on-surface hover:text-primary transition-colors" title="Edit Trainer" onclick="window.editTrainer('${t.id}')">
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button class="p-2 rounded-lg bg-surface-container-highest text-outline-variant hover:text-error transition-colors" title="Delete Trainer" onclick="window.deleteTrainer('${t.id}', '${t.name}')">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    `;
    }).join('');
}
function setupEventListeners() {
    const addForm = document.getElementById('add-trainer-form');
    addForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addForm);
        const payload = Object.fromEntries(formData.entries());
        try {
            const res = await apiRequest('/trainers', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.success) {
                showToast('Trainer registered successfully!', 'success');
                addForm.reset();
                window.closeAddModal();
                await loadTrainers();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to add trainer', 'error');
        }
    });
    const assignForm = document.getElementById('assign-trainer-form');
    assignForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const trainerId = document.getElementById('assign-trainer-id').value;
        const memberName = document.getElementById('assign-member-select').value;
        try {
            const res = await apiRequest(`/trainers/${trainerId}/assign`, {
                method: 'POST',
                body: JSON.stringify({ memberName })
            });
            if (res.success) {
                showToast(`Assigned ${memberName} to coach!`, 'success');
                window.closeAssignModal();
                await loadTrainers();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to assign athlete', 'error');
        }
    });
}
window.openAssignModal = (id, name) => {
    document.getElementById('assign-trainer-id').value = id;
    document.getElementById('assign-trainer-name').textContent = name;
    document.getElementById('assign-trainer-modal')?.classList.remove('hidden');
};
window.editTrainer = (id) => {
    const trainer = allTrainers.find(t => t.id === id);
    if (!trainer)
        return;
    document.getElementById('edit-trainer-id').value = trainer.id;
    document.getElementById('edit-trainer-name').value = trainer.name;
    document.getElementById('edit-trainer-spec').value = trainer.specialization;
    document.getElementById('edit-trainer-phone').value = trainer.phone;
    document.getElementById('edit-trainer-exp').value = trainer.experience;
    document.getElementById('edit-trainer-bio').value = trainer.bio || '';
    document.getElementById('edit-trainer-modal')?.classList.remove('hidden');
};
window.deleteTrainer = async (id, name) => {
    if (!confirm(`Are you sure you want to remove coach "${name}"?`))
        return;
    try {
        const res = await apiRequest(`/trainers/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast(`Coach "${name}" removed successfully`, 'success');
            await loadTrainers();
        }
    }
    catch (err) {
        showToast(err.message || 'Failed to delete coach', 'error');
    }
};
