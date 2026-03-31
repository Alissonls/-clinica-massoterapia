/** modal.js — Gerenciamento de Modais */
import { $$ } from './dom.js';

export const openModal     = id => document.getElementById(id)?.classList.add('open');
export const closeModal    = id => document.getElementById(id)?.classList.remove('open');
export const closeAllModals = () => $$('.modal-overlay').forEach(m => m.classList.remove('open'));

/** Inicializa listeners padrão de fechamento. Chamar uma vez no app.js. */
export function initModals() {
  $$('.modal-close, .modal-cancel').forEach(b => b.addEventListener('click', closeAllModals));
  $$('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) closeAllModals(); }));
}
