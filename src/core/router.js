/**
 * router.js — Roteador SPA
 * Gerencia navegação entre páginas e registro de page loaders.
 */
import { $, $$ } from '../utils/dom.js';

export let currentPage = 'dashboard';

const _loaders = {};

const PAGE_TITLES = {
  dashboard:    '🏠 Dashboard',
  agendamentos: '📅 Agendamentos',
  clientes:     '👥 Clientes',
  terapeutas:   '💆 Terapeutas',
  fichas:       '📋 Fichas',
  relatorios:   '📊 Relatórios',
};

export const PAGE_CTA_LABELS = {
  dashboard:    '+ Novo Agendamento',
  agendamentos: '+ Agendar',
  clientes:     '+ Novo Cliente',
  terapeutas:   '+ Nova Terapeuta',
  fichas:       '+ Nova Anotação',
  relatorios:   '+ Exportar',
};

/** Registra um loader de página. */
export function registerPageLoader(page, fn) { _loaders[page] = fn; }

/** Navega para a página informada. */
export function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) { target.classList.add('active'); currentPage = page; }
  const navItem = $(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;
  const btn = document.getElementById('topbar-novo-btn');
  if (btn) btn.textContent = PAGE_CTA_LABELS[page] || '+ Novo';
  _loaders[page]?.();
}
