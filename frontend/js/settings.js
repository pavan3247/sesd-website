import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
export async function initSettings() {
    if (!checkAuth())
        return;
    await loadProfile();
    setupEventListeners();
}
async function loadProfile() {
    try {
        const res = await apiRequest('/auth/me');
        if (res.success && res.admin) {
            const a = res.admin;
            document.getElementById('settings-name').value = a.name || '';
            document.getElementById('settings-email').value = a.email || '';
            document.getElementById('settings-phone').value = a.phone || '';
            document.getElementById('settings-gym-name').value = a.gymName || '';
            document.getElementById('settings-address').value = a.address || '';
        }
    }
    catch (err) {
        showToast('Failed to load profile: ' + err.message, 'error');
    }
}
function setupEventListeners() {
    // Profile update form
    const profileForm = document.getElementById('profile-form');
    profileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('settings-name').value;
        const phone = document.getElementById('settings-phone').value;
        const gymName = document.getElementById('settings-gym-name').value;
        const address = document.getElementById('settings-address').value;
        try {
            const res = await apiRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ name, phone, gymName, address })
            });
            if (res.success) {
                showToast('Gym profile updated successfully!', 'success');
                // Update user in session
                const stored = localStorage.getItem('fitzone_user') || sessionStorage.getItem('fitzone_user');
                if (stored) {
                    const userObj = JSON.parse(stored);
                    Object.assign(userObj, { name, phone, gymName, address });
                    if (localStorage.getItem('fitzone_user')) {
                        localStorage.setItem('fitzone_user', JSON.stringify(userObj));
                    }
                    else {
                        sessionStorage.setItem('fitzone_user', JSON.stringify(userObj));
                    }
                }
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to update profile', 'error');
        }
    });
    // Password change form
    const passForm = document.getElementById('password-form');
    passForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (newPassword !== confirmPassword) {
            showToast('New password and confirm password do not match!', 'error');
            return;
        }
        try {
            const res = await apiRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (res.success) {
                showToast('Demo password updated successfully!', 'success');
                passForm.reset();
            }
        }
        catch (err) {
            showToast(err.message || 'Failed to update password', 'error');
        }
    });
}
