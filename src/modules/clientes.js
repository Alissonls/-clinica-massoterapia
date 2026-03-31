/** clientes.js — Módulo de Clientes */
import { DB } from '../core/db.js';
import { sanitizeHTML, sanitizeClienteInput, validateEmail, validatePhone } from '../core/security.js';
import { formatDate, initPhoneMask } from '../utils/formatters.js';
import { toast } from '../utils/toast.js';
import { openModal, closeAllModals } from '../utils/modal.js';
import { navigate } from '../core/router.js';
import { loadDashboard } from './dashboard.js';

let clienteSearch = '';

export function loadClientes() { renderClientes(); }

export function renderClientes() {
  const q = clienteSearch.toLowerCase();
  const lista = DB.getClientes()
    .filter(c => !q || c.nome.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.telefone||'').includes(q))
    .sort((a,b) => a.nome.localeCompare(b.nome));

  const tbody = document.getElementById('clientes-tbody');
  tbody.innerHTML = '';
  document.getElementById('clientes-count').textContent = `${lista.length} cliente${lista.length!==1?'s':''}`;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:40px"><div class="emoji">👥</div><h3>Nenhum cliente</h3><p>Cadastre o primeiro cliente para começar.</p></div></td></tr>`;
    return;
  }
  lista.forEach(c => {
    const ags = DB.getAgendamentos().filter(a => a.clienteId === c.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div style="display:flex;align-items:center;gap:12px">
        <div class="avatar" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117">${sanitizeHTML(c.nome.charAt(0).toUpperCase())}</div>
        <div><div style="font-weight:600">${sanitizeHTML(c.nome)}</div><div class="td-muted" style="font-size:11px">Desde ${formatDate(c.dataCadastro)}</div></div>
      </div></td>
      <td>${sanitizeHTML(c.telefone||'–')}</td>
      <td>${sanitizeHTML(c.email||'–')}</td>
      <td>${ags.length} sessão${ags.length!==1?'ões':''}</td>
      <td><span class="badge ${c.aceiteLgpd?'badge-confirmado':'badge-cancelado'}">${c.aceiteLgpd?'✓ Aceito':'✗ Pendente'}</span></td>
      <td><div class="table-actions">
        <button class="btn btn-sm btn-secondary" data-ficha-cliente="${sanitizeHTML(c.id)}" title="Ficha">📋</button>
        <button class="btn btn-sm btn-secondary" data-edit-cliente="${sanitizeHTML(c.id)}" title="Editar">✏️</button>
        <button class="btn btn-sm btn-danger" data-del-cliente="${sanitizeHTML(c.id)}" title="Excluir">🗑️</button>
      </div></td>`;
    tbody.appendChild(tr);
  });
}

export function openNovoCliente() {
  document.getElementById('cliente-form').reset();
  document.getElementById('cliente-form').removeAttribute('data-edit-id');
  document.getElementById('cliente-modal-title').textContent = '👤 Novo Cliente';
  openModal('modal-cliente');
}

export function editCliente(id) {
  const c = DB.getCliente(id);
  if (!c) return;
  document.getElementById('cliente-nome').value          = c.nome || '';
  document.getElementById('cliente-telefone').value      = c.telefone || '';
  document.getElementById('cliente-email').value         = c.email || '';
  document.getElementById('cliente-datanascimento').value = c.dataNascimento || '';
  document.getElementById('cliente-lgpd').checked        = !!c.aceiteLgpd;
  document.getElementById('cliente-form').setAttribute('data-edit-id', id);
  document.getElementById('cliente-modal-title').textContent = '✏️ Editar Cliente';
  openModal('modal-cliente');
}

export function deleteCliente(id) {
  if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return;
  DB.deleteCliente(id);
  toast('Cliente excluído', 'info');
  renderClientes();
}

export function verFichaCliente(clienteId) {
  navigate('fichas');
  setTimeout(() => {
    const event = new CustomEvent('abrirFichaCliente', { detail: { clienteId } });
    document.dispatchEvent(event);
  }, 100);
}

export function initClientesForm() {
  initPhoneMask(document.getElementById('cliente-telefone'));

  document.getElementById('cliente-search-input').addEventListener('input', e => {
    clienteSearch = e.target.value;
    renderClientes();
  });

  document.getElementById('cliente-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId = e.target.getAttribute('data-edit-id');
    const lgpd   = document.getElementById('cliente-lgpd').checked;
    if (!lgpd) { toast('O cliente precisa aceitar o termo LGPD para ser cadastrado.', 'error'); return; }

    const email    = document.getElementById('cliente-email').value.trim();
    const telefone = document.getElementById('cliente-telefone').value.trim();
    if (!validateEmail(email))   { toast('E-mail inválido', 'error'); return; }
    if (!validatePhone(telefone)) { toast('Telefone inválido', 'error'); return; }

    const raw = {
      ...(editId ? { id: editId } : {}),
      nome: document.getElementById('cliente-nome').value.trim(),
      telefone, email,
      dataNascimento: document.getElementById('cliente-datanascimento').value,
      aceiteLgpd: lgpd,
      dataAceiteLgpd: new Date().toISOString(),
    };
    if (!raw.nome) { toast('Nome é obrigatório', 'error'); return; }
    DB.saveCliente(sanitizeClienteInput(raw));
    toast(editId ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
    closeAllModals();
    renderClientes();
    loadDashboard();
  });

  document.getElementById('clientes-tbody').addEventListener('click', e => {
    const fichaBtn = e.target.closest('[data-ficha-cliente]');
    const editBtn  = e.target.closest('[data-edit-cliente]');
    const delBtn   = e.target.closest('[data-del-cliente]');
    if (fichaBtn) verFichaCliente(fichaBtn.dataset.fichaCliente);
    if (editBtn)  editCliente(editBtn.dataset.editCliente);
    if (delBtn)   deleteCliente(delBtn.dataset.delCliente);
  });
}
