import { apiRequest, showToast } from './api.js';

export function getAuthToken(): string | null {
  return localStorage.getItem('fitzone_token') || sessionStorage.getItem('fitzone_token');
}

export function getCurrentUser(): any {
  const raw = localStorage.getItem('fitzone_user') || sessionStorage.getItem('fitzone_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function checkAuth(): boolean {
  const token = getAuthToken();
  const isLoginPage = window.location.pathname.endsWith('login.html');

  if (!token && !isLoginPage) {
    window.location.href = 'login.html';
    return false;
  }

  if (token && isLoginPage) {
    window.location.href = 'dashboard.html';
    return true;
  }

  return !!token;
}

export function logout() {
  localStorage.removeItem('fitzone_token');
  localStorage.removeItem('fitzone_user');
  sessionStorage.removeItem('fitzone_token');
  sessionStorage.removeItem('fitzone_user');
  window.location.href = 'login.html';
}

export async function login(email: string, pass: string, remember: boolean): Promise<boolean> {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });

    if (res.success && res.token) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('fitzone_token', res.token);
      storage.setItem('fitzone_user', JSON.stringify(res.admin));

      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
      return true;
    }
    return false;
  } catch (err: any) {
    showToast(err.message || 'Login failed. Please check credentials.', 'error');
    return false;
  }
}
