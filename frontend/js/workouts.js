import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
let allWorkouts = [];
let allMembers = [];
let allTrainers = [];
export async function initWorkouts() {
    if (!checkAuth())
        return;
    await Promise.all([loadWorkouts(), loadMembersAndTrainers()]);
    setupEventListeners();
}
async function loadMembersAndTrainers() {
    try {
        const [mRes, tRes] = await Promise.all([
            apiRequest('/members'),
            apiRequest('/trainers')
        ]);
        if (mRes.success) {
            allMembers = mRes.data;
            const memSelect = document.getElementById('workout-member-select');
            if (memSelect) {
                memSelect.innerHTML = allMembers.map(m => `<option value="${m.name}">${m.name} (${m.id})</option>`).join('');
            }
        }
        if (tRes.success) {
            allTrainers = tRes.data;
            const tSelect = document.getElementById('workout-trainer-select');
            if (tSelect) {
                tSelect.innerHTML = allTrainers.map(t => `<option value="${t.name}">${t.name} (${t.specialization})</option>`).join('');
            }
        }
    }
    catch (e) {
        console.error(e);
    }
}
export async function loadWorkouts() {
    try {
        const res = await apiRequest('/workouts');
        if (res.success) {
            allWorkouts = res.data;
            renderWorkoutsGrid(allWorkouts);
            const countEl = document.getElementById('workouts-count-badge');
            if (countEl)
                countEl.textContent = `${res.count} Regimens`;
        }
    }
    catch (err) {
        showToast('Failed to load workouts: ' + err.message, 'error');
    }
}
function renderWorkoutsGrid(workouts) {
    const container = document.getElementById('workouts-grid-container');
    if (!container)
        return;
    if (workouts.length === 0) {
        container.innerHTML = `
      <div class="col-span-full py-12 text-center text-outline-variant">
        <span class="material-symbols-outlined text-4xl mb-2">fitness_center</span>
        <p class="text-sm">No workout regimens found.</p>
      </div>
    `;
        return;
    }
    container.innerHTML = workouts.map(w => {
        const diffBadge = w.difficulty === 'Advanced'
            ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container/40 text-error">Advanced</span>'
            : (w.difficulty === 'Intermediate'
                ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container/20 text-primary">Intermediate</span>'
                : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary-container/20 text-tertiary">Beginner</span>');
        return `
      <div class="bg-surface-container rounded-2xl p-6 border border-surface-container-high hover:bg-surface-container-high/40 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="font-mono text-xs text-outline">${w.id}</span>
              <h3 class="font-headline-sm text-lg font-bold text-on-surface mt-0.5">${w.planName}</h3>
            </div>
            ${diffBadge}
          </div>

          <p class="text-xs text-primary font-medium mb-4 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">target</span>
            <span>${w.targetGoal}</span>
          </p>

          <div class="space-y-2 p-3 rounded-xl bg-surface-container-high mb-4 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-outline-variant">Assigned Athlete:</span>
              <span class="font-semibold text-on-surface">${w.memberName}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-outline-variant">Supervising Coach:</span>
              <span class="font-semibold text-primary">${w.trainerName}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-outline-variant">Session Duration:</span>
              <span class="font-bold text-on-surface">${w.duration}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-outline-variant">Prescribed Exercises:</span>
              <span class="font-bold text-tertiary">${(w.exercises || []).length} Exercises</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-surface-container-high flex items-center justify-between gap-2">
          <button class="flex-1 py-2 px-3 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim text-xs font-bold transition-colors flex items-center justify-center gap-1.5" onclick="window.viewWorkoutRoutine('${w.id}')">
            <span class="material-symbols-outlined text-[16px]">list_alt</span>
            <span>View Routine</span>
          </button>
          <button class="p-2 rounded-lg bg-surface-container-highest text-outline-variant hover:text-error transition-colors" title="Delete Plan" onclick="window.deleteWorkout('${w.id}', '${w.planName}')">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    `;
    }).join('');
}
function setupEventListeners() {
    const form = document.getElementById('add-workout-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const planName = formData.get('planName');
        const memberName = formData.get('memberName');
        const trainerName = formData.get('trainerName');
        const duration = formData.get('duration');
        const difficulty = formData.get('difficulty');
        const targetGoal = formData.get('targetGoal');
        // Collect dynamic exercise inputs
        const exerciseRows = document.querySelectorAll('.exercise-row');
        const exercises = [];
        exerciseRows.forEach((row) => {
            const name = row.querySelector('.ex-name')?.value;
            const sets = row.querySelector('.ex-sets')?.value;
            const reps = row.querySelector('.ex-reps')?.value;
            const weight = row.querySelector('.ex-weight')?.value;
            const target = row.querySelector('.ex-target')?.value;
            if (name) {
                exercises.push({ name, sets, reps, weight, target });
            }
        });
        try {
            const res = await apiRequest('/workouts', {
                method: 'POST',
                body: JSON.stringify({
                    planName,
                    memberName,
                    trainerName,
                    duration,
                    difficulty,
                    targetGoal,
                    exercises
                })
            });
            if (res.success) {
                showToast('Workout plan created successfully!', 'success');
                form.reset();
                window.closeAddModal();
                await loadWorkouts();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to create workout plan', 'error');
        }
    });
}
window.viewWorkoutRoutine = (id) => {
    const w = allWorkouts.find(x => x.id === id);
    if (!w)
        return;
    const modal = document.getElementById('routine-modal');
    const title = document.getElementById('routine-modal-title');
    const details = document.getElementById('routine-modal-details');
    const tbody = document.getElementById('routine-modal-tbody');
    if (title)
        title.textContent = w.planName;
    if (details) {
        details.innerHTML = `Athlete: <span class="text-on-surface font-bold">${w.memberName}</span> • Coach: <span class="text-primary font-bold">${w.trainerName}</span> • Duration: ${w.duration} • ${w.difficulty}`;
    }
    if (tbody) {
        tbody.innerHTML = (w.exercises || []).map((ex, idx) => `
      <tr class="border-b border-surface-container-high/60 text-xs">
        <td class="py-3 px-3 font-mono text-outline">${idx + 1}</td>
        <td class="py-3 px-3 font-semibold text-on-surface">${ex.name}</td>
        <td class="py-3 px-3 text-tertiary font-bold">${ex.sets}</td>
        <td class="py-3 px-3 text-on-surface">${ex.reps}</td>
        <td class="py-3 px-3 text-primary font-mono">${ex.weight}</td>
        <td class="py-3 px-3 text-outline-variant">${ex.target}</td>
      </tr>
    `).join('');
    }
    modal?.classList.remove('hidden');
};
window.deleteWorkout = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the workout plan "${name}"?`))
        return;
    try {
        const res = await apiRequest(`/workouts/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast(`Workout plan "${name}" deleted`, 'success');
            await loadWorkouts();
        }
    }
    catch (err) {
        showToast(err.message || 'Failed to delete workout plan', 'error');
    }
};
