import { apiRequest, showToast } from './api.js';
import { checkAuth } from './auth.js';
import { Admin } from './types.js';

export async function initSettings() {
  if (!checkAuth()) return;
  await loadProfile();
  setupEventListeners();
}

async function loadProfile() {
  try {
    const res = await apiRequest<{ success: boolean; admin: Admin }>('/auth/me');
    if (res.success && res.admin) {
      const a = res.admin;
      (document.getElementById('settings-name') as HTMLInputElement).value = a.name || '';
      (document.getElementById('settings-email') as HTMLInputElement).value = a.email || '';
      (document.getElementById('settings-phone') as HTMLInputElement).value = a.phone || '';
      (document.getElementById('settings-gym-name') as HTMLInputElement).value = a.gymName || '';
      (document.getElementById('settings-address') as HTMLTextAreaElement).value = a.address || '';
    }
  } catch (err: any) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

function setupEventListeners() {
  // Profile update form
  const profileForm = document.getElementById('profile-form') as HTMLFormElement;
  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('settings-name') as HTMLInputElement).value;
    const phone = (document.getElementById('settings-phone') as HTMLInputElement).value;
    const gymName = (document.getElementById('settings-gym-name') as HTMLInputElement).value;
    const address = (document.getElementById('settings-address') as HTMLTextAreaElement).value;

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
          } else {
            sessionStorage.setItem('fitzone_user', JSON.stringify(userObj));
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  });

  // Password change form
  const passForm = document.getElementById('password-form') as HTMLFormElement;
  passForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = (document.getElementById('current-password') as HTMLInputElement).value;
    const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

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
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    }
  });
}
