/** terapeutas.js — Módulo de Terapeutas */
import { DB } from '../core/db.js';
import { sanitizeHTML, sanitizeText } from '../core/security.js';
import { todayISO } from '../utils/formatters.js';
import { toast } from '../utils/toast.js';
import { openModal, closeAllModals } from '../utils/modal.js';

export function loadTerapeutas() { renderTerapeutas(); }

export function renderTerapeutas() {
  const lista = DB.getTerapeutas();
  const container = document.getElementById('terapeutas-grid');
  document.getElementById('terapeutas-count').textContent = `${lista.length} terapeuta${lista.length!==1?'s':''}`;
  container.innerHTML = '';
  if (!lista.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px"><div class="emoji">💆</div><h3>Nenhuma terapeuta</h3><p>Cadastre as terapeutas para começar.</p></div>`;
    return;
  }
  lista.forEach(t => {
    const ags    = DB.getAgendamentos().filter(a => a.terapeutaId === t.id);
    const agHoje = ags.filter(a => a.data === todayISO() && a.status !== 'cancelado');
    const card = document.createElement('div');
    card.className = 'terapeuta-card';
    card.innerHTML = `
      <div class="terapeuta-header">
        <div class="avatar avatar-lg" style="background:${sanitizeHTML(t.cor||'#6ee7b7')}">${sanitizeHTML(t.emoji||'💆')}</div>
        <div class="terapeuta-info"><h3>${sanitizeHTML(t.nome)}</h3><p>${sanitizeHTML(t.especialidade||'Massoterapia')}</p></div>
      </div>
      <div class="terapeuta-stats">
        <div class="terapeuta-stat"><div class="val">${agHoje.length}</div><div class="lbl">Hoje</div></div>
        <div class="terapeuta-stat"><div class="val">${ags.filter(a=>a.status==='realizado').length}</div><div class="lbl">Total</div></div>
        <div class="terapeuta-stat"><div class="val">${ags.filter(a=>a.status!=='cancelado').length}</div><div class="lbl">Ativos</div></div>
      </div>
      <div class="table-actions" style="margin-top:4px">
        <button class="btn btn-sm btn-outline w-full" data-edit-terapeuta="${sanitizeHTML(t.id)}">✏️ Editar</button>
        <button class="btn btn-sm btn-danger" data-del-terapeuta="${sanitizeHTML(t.id)}">🗑️</button>
      </div>`;
    container.appendChild(card);
  });
}

export function openNovaTerapeuta() {
  document.getElementById('terapeuta-form').reset();
  document.getElementById('terapeuta-form').removeAttribute('data-edit-id');
  document.getElementById('terapeuta-modal-title').textContent = '💆 Nova Terapeuta';
  openModal('modal-terapeuta');
}

export function editTerapeuta(id) {
  const t = DB.getTerapeuta(id);
  if (!t) return;
  document.getElementById('terapeuta-nome').value         = t.nome || '';
  document.getElementById('terapeuta-especialidade').value = t.especialidade || '';
  document.getElementById('terapeuta-cor').value          = t.cor || '#6ee7b7';
  document.getElementById('terapeuta-emoji').value        = t.emoji || '💆';
  document.getElementById('terapeuta-form').setAttribute('data-edit-id', id);
  document.getElementById('terapeuta-modal-title').textContent = '✏️ Editar Terapeuta';
  openModal('modal-terapeuta');
}

export function deleteTerapeuta(id) {
  if (!confirm('Excluir esta terapeuta? Os agendamentos associados serão mantidos.')) return;
  DB.deleteTerapeuta(id);
  toast('Terapeuta excluída', 'info');
  renderTerapeutas();
}

export function initTerapeutasForm() {
  document.getElementById('terapeuta-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId = e.target.getAttribute('data-edit-id');
    const t = {
      ...(editId ? { id: editId } : {}),
      nome:          sanitizeText(document.getElementById('terapeuta-nome').value),
      especialidade: sanitizeText(document.getElementById('terapeuta-especialidade').value),
      cor:   document.getElementById('terapeuta-cor').value,
      emoji: document.getElementById('terapeuta-emoji').value.trim() || '💆',
    };
    if (!t.nome) { toast('Nome é obrigatório', 'error'); return; }
    DB.saveTerapeuta(t);
    toast(editId ? 'Terapeuta atualizada!' : 'Terapeuta cadastrada!', 'success');
    closeAllModals();
    renderTerapeutas();
  });

  document.getElementById('terapeutas-grid').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-terapeuta]');
    const delBtn  = e.target.closest('[data-del-terapeuta]');
    if (editBtn) editTerapeuta(editBtn.dataset.editTerapeuta);
    if (delBtn)  deleteTerapeuta(delBtn.dataset.delTerapeuta);
  });
}
