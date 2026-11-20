const API_BASE = '/api';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  let container = document.getElementById('fitzone-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'fitzone-toast-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success'
    ? 'bg-surface-container border border-tertiary/40 text-on-surface'
    : (type === 'error' ? 'bg-surface-container border border-error/50 text-error' : 'bg-surface-container border border-primary/40 text-on-surface');

  const iconName = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
  const iconColor = type === 'success' ? 'text-tertiary' : (type === 'error' ? 'text-error' : 'text-primary');

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${bgClass} min-w-[300px] max-w-md`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[22px] ${iconColor}">${iconName}</span>
    <span class="font-body-md text-sm flex-1">${message}</span>
    <button class="text-outline-variant hover:text-on-surface text-sm" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `API error: ${res.statusText}`);
    }

    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}
