/** agendamentos.js — Módulo de Agendamentos */
import { DB } from '../core/db.js';
import { sanitizeHTML, sanitizeAgendamentoInput, validateTimeRange } from '../core/security.js';
import { formatDate, todayISO } from '../utils/formatters.js';
import { toast } from '../utils/toast.js';
import { openModal, closeAllModals } from '../utils/modal.js';
import { loadDashboard } from './dashboard.js';

export let agFiltroData = todayISO();

export function loadAgendamentos() {
  const el = document.getElementById('ag-data-filtro');
  if (el) el.value = agFiltroData;
  renderAgendamentos();
}

export function renderAgendamentos() {
  const data = document.getElementById('ag-data-filtro')?.value || agFiltroData;
  agFiltroData = data;
  const ags = DB.getAgendamentos()
    .filter(a => !data || a.data === data)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const tbody = document.getElementById('ag-tbody');
  tbody.innerHTML = '';
  if (!ags.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:40px"><div class="emoji">📅</div><h3>Nenhum agendamento</h3><p>Sem agendamentos para este dia.</p></div></td></tr>`;
    return;
  }
  ags.forEach(ag => {
    const cliente   = DB.getCliente(ag.clienteId);
    const terapeuta = DB.getTerapeuta(ag.terapeutaId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(ag.data)}<br><span class="td-muted">${sanitizeHTML(ag.horaInicio)} – ${sanitizeHTML(ag.horaFim)}</span></td>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="avatar avatar-sm" style="background:${sanitizeHTML(terapeuta?.cor||'#6ee7b7')}">${sanitizeHTML(terapeuta?.emoji||'💆')}</div>
        <div><div style="font-weight:600">${sanitizeHTML(cliente?.nome||'–')}</div><div class="td-muted">${sanitizeHTML(cliente?.telefone||'')}</div></div>
      </div></td>
      <td><div style="font-weight:500">${sanitizeHTML(terapeuta?.nome||'–')}</div><div class="td-muted">${sanitizeHTML(terapeuta?.especialidade?.split(',')[0]||'')}</div></td>
      <td>${sanitizeHTML(ag.servico||'–')}</td>
      <td><span class="badge badge-${sanitizeHTML(ag.status)}">${sanitizeHTML(ag.status)}</span></td>
      <td class="td-muted text-xs">${sanitizeHTML(ag.observacoes||'–')}</td>
      <td><div class="table-actions">
        <button class="btn btn-sm btn-secondary" data-edit-ag="${sanitizeHTML(ag.id)}" title="Editar">✏️</button>
        <button class="btn btn-sm btn-danger" data-del-ag="${sanitizeHTML(ag.id)}" title="Excluir">🗑️</button>
      </div></td>`;
    tbody.appendChild(tr);
  });
}

export function populateClienteSelect(selectedId = '') {
  const sel = document.getElementById('ag-cliente');
  sel.innerHTML = '<option value="">Selecione o cliente...</option>';
  DB.getClientes().sort((a,b) => a.nome.localeCompare(b.nome)).forEach(c => {
    const op = document.createElement('option');
    op.value = c.id; op.textContent = c.nome + (c.telefone ? ` · ${c.telefone}` : '');
    if (c.id === selectedId) op.selected = true;
    sel.appendChild(op);
  });
}

export function populateTerapeutaSelect(selectedId = '') {
  const sel = document.getElementById('ag-terapeuta');
  sel.innerHTML = '<option value="">Selecione a terapeuta...</option>';
  DB.getTerapeutas().sort((a,b) => a.nome.localeCompare(b.nome)).forEach(t => {
    const op = document.createElement('option');
    op.value = t.id; op.textContent = `${t.emoji||'💆'} ${t.nome}`;
    if (t.id === selectedId) op.selected = true;
    sel.appendChild(op);
  });
}

export function openNovoAgendamento() {
  document.getElementById('ag-form').reset();
  document.getElementById('ag-form').removeAttribute('data-edit-id');
  document.getElementById('ag-data').value = agFiltroData;
  document.getElementById('ag-modal-title').textContent = '📅 Novo Agendamento';
  populateClienteSelect();
  populateTerapeutaSelect();
  openModal('modal-agendamento');
}

export function editAgendamento(id) {
  const ag = DB.getAgendamento(id);
  if (!ag) return;
  populateClienteSelect(ag.clienteId);
  populateTerapeutaSelect(ag.terapeutaId);
  document.getElementById('ag-data').value         = ag.data;
  document.getElementById('ag-hora-inicio').value  = ag.horaInicio;
  document.getElementById('ag-hora-fim').value     = ag.horaFim;
  document.getElementById('ag-servico').value      = ag.servico || '';
  document.getElementById('ag-status').value       = ag.status;
  document.getElementById('ag-observacoes').value  = ag.observacoes || '';
  document.getElementById('ag-form').setAttribute('data-edit-id', id);
  document.getElementById('ag-modal-title').textContent = '✏️ Editar Agendamento';
  openModal('modal-agendamento');
}

export function deleteAgendamento(id) {
  if (!confirm('Excluir este agendamento?')) return;
  DB.deleteAgendamento(id);
  toast('Agendamento excluído', 'info');
  renderAgendamentos();
  loadDashboard();
}

export function initAgendamentosForm() {
  document.getElementById('ag-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId     = e.target.getAttribute('data-edit-id');
    const data       = document.getElementById('ag-data').value;
    const horaInicio = document.getElementById('ag-hora-inicio').value;
    const horaFim    = document.getElementById('ag-hora-fim').value;
    const clienteId  = document.getElementById('ag-cliente').value;
    const terapeutaId = document.getElementById('ag-terapeuta').value;
    const status     = document.getElementById('ag-status').value;

    if (!clienteId || !terapeutaId || !data || !horaInicio || !horaFim) {
      toast('Preencha todos os campos obrigatórios', 'error'); return;
    }
    if (!validateTimeRange(horaInicio, horaFim)) {
      toast('Horário de início deve ser antes do fim', 'error'); return;
    }
    const conflito = DB.checkConflito(data, horaInicio, horaFim, editId || null);
    if (conflito) {
      const tc = DB.getTerapeuta(conflito.terapeutaId);
      toast(`Conflito de sala! ${tc?.nome || 'Outra terapeuta'} já tem sessão às ${conflito.horaInicio}–${conflito.horaFim}`, 'error', '⚠️');
      return;
    }
    const raw = { ...(editId ? { id: editId } : {}), clienteId, terapeutaId, data, horaInicio, horaFim, status,
      servico: document.getElementById('ag-servico').value,
      observacoes: document.getElementById('ag-observacoes').value,
    };
    DB.saveAgendamento(sanitizeAgendamentoInput(raw));
    toast(editId ? 'Agendamento atualizado!' : 'Agendamento criado!', 'success');
    closeAllModals();
    renderAgendamentos();
    loadDashboard();
  });

  document.getElementById('ag-data-filtro').addEventListener('change', renderAgendamentos);
  document.getElementById('ag-data-anterior').addEventListener('click', () => {
    const d = new Date(agFiltroData); d.setDate(d.getDate() - 1);
    agFiltroData = d.toISOString().slice(0, 10);
    document.getElementById('ag-data-filtro').value = agFiltroData;
    renderAgendamentos();
  });
  document.getElementById('ag-data-proximo').addEventListener('click', () => {
    const d = new Date(agFiltroData); d.setDate(d.getDate() + 1);
    agFiltroData = d.toISOString().slice(0, 10);
    document.getElementById('ag-data-filtro').value = agFiltroData;
    renderAgendamentos();
  });
  document.getElementById('ag-hoje-btn').addEventListener('click', () => {
    agFiltroData = todayISO();
    document.getElementById('ag-data-filtro').value = agFiltroData;
    renderAgendamentos();
  });

  // Event delegation para editar/excluir
  document.getElementById('ag-tbody').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-ag]');
    const delBtn  = e.target.closest('[data-del-ag]');
    if (editBtn) editAgendamento(editBtn.dataset.editAg);
    if (delBtn)  deleteAgendamento(delBtn.dataset.delAg);
  });
}
