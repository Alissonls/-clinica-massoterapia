/** toast.js — Sistema de Notificações Toast */
const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

/**
 * Exibe uma notificação toast temporária.
 * @param {string} msg
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} [icon]
 */
export function toast(msg, type = 'success', icon = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icon || ICONS[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}
