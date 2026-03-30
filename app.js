// ============================================================
// APP.JS – Main Application Logic & SPA Router
// ============================================================

// ---- Utils ----
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function toast(msg, type = 'success', icon = '') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icon || icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}
function formatDateTime(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatPhone(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function initPhoneMask(input) {
  input.addEventListener('input', () => {
    const v = input.value.replace(/\D/g, '').slice(0, 11);
    const f = v.length <= 10
      ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      : v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    input.value = f.replace(/-$/, '');
  });
}

// ---- Router ----
let currentPage = 'dashboard';

function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) { target.classList.add('active'); currentPage = page; }
  const navItem = $(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  const titles = {
    dashboard: '🏠 Dashboard',
    agendamentos: '📅 Agendamentos',
    clientes: '👥 Clientes',
    terapeutas: '💆 Terapeutas',
    fichas: '📋 Fichas',
    relatorios: '📊 Relatórios',
  };
  $('#topbar-title').textContent = titles[page] || page;
  pageLoaders[page]?.();
}

// ---- Modals ----
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeAllModals() { $$('.modal-overlay').forEach(m => m.classList.remove('open')); }

$$('.modal-close, .modal-cancel').forEach(b => {
  b.addEventListener('click', () => closeAllModals());
});
$$('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeAllModals(); });
});

// ============================================================
// PAGE: DASHBOARD
// ============================================================
function loadDashboard() {
  const ags = DB.getAgendamentos();
  const hoje = todayISO();
  const agHoje = ags.filter(a => a.data === hoje && a.status !== 'cancelado');
  const agSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    const limit = d.toISOString().slice(0, 10);
    return ags.filter(a => a.data >= hoje && a.data <= limit && a.status !== 'cancelado');
  })();

  document.getElementById('stat-hoje').textContent = agHoje.length;
  document.getElementById('stat-clientes').textContent = DB.getClientes().length;
  document.getElementById('stat-terapeutas').textContent = DB.getTerapeutas().length;
  document.getElementById('stat-semana').textContent = agSemana.length;

  // Próximos agendamentos (hoje + amanhã)
  const agFuturos = ags
    .filter(a => a.data >= hoje && a.status !== 'cancelado')
    .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio))
    .slice(0, 8);

  const container = document.getElementById('proximos-agendamentos');
  if (!agFuturos.length) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">📅</div><h3>Sem agendamentos</h3><p>Não há consultas agendadas nos próximos dias.</p></div>`;
    return;
  }
  container.innerHTML = '';
  agFuturos.forEach(ag => renderAgHoje(ag, container));
}

function renderAgHoje(ag, container) {
  const cliente = DB.getCliente(ag.clienteId);
  const terapeuta = DB.getTerapeuta(ag.terapeutaId);
  const isHoje = ag.data === todayISO();
  const el = document.createElement('div');
  el.className = 'timeline-item';
  el.innerHTML = `
    <div class="timeline-dot" style="background:${terapeuta?.cor || '#6ee7b7'}"></div>
    <div class="timeline-content">
      <div class="timeline-time">${isHoje ? 'Hoje' : formatDate(ag.data)} · ${ag.horaInicio}–${ag.horaFim} · <span class="badge badge-${ag.status}">${ag.status}</span></div>
      <div class="timeline-text">
        <strong>${cliente?.nome || 'Cliente'}</strong> com <strong>${terapeuta?.nome || 'Terapeuta'}</strong>
        ${ag.servico ? `<span class="text-muted"> · ${ag.servico}</span>` : ''}
      </div>
    </div>
  `;
  container.appendChild(el);
}

// ============================================================
// PAGE: AGENDAMENTOS
// ============================================================
let agFiltroData = todayISO();

function loadAgendamentos() {
  document.getElementById('ag-data-filtro').value = agFiltroData;
  renderAgendamentos();
}

function renderAgendamentos() {
  const data = document.getElementById('ag-data-filtro').value;
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
    const cliente = DB.getCliente(ag.clienteId);
    const terapeuta = DB.getTerapeuta(ag.terapeutaId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ag.data ? formatDate(ag.data) : '–'}<br><span class="td-muted">${ag.horaInicio} – ${ag.horaFim}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar avatar-sm" style="background:${terapeuta?.cor||'#6ee7b7'}">${terapeuta?.emoji||'💆'}</div>
          <div>
            <div style="font-weight:600">${cliente?.nome || '–'}</div>
            <div class="td-muted">${cliente?.telefone || ''}</div>
          </div>
        </div>
      </td>
      <td><div style="font-weight:500">${terapeuta?.nome || '–'}</div><div class="td-muted">${terapeuta?.especialidade?.split(',')[0] || ''}</div></td>
      <td>${ag.servico || '–'}</td>
      <td><span class="badge badge-${ag.status}">${ag.status}</span></td>
      <td class="td-muted text-xs">${ag.observacoes || '–'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-secondary" onclick="editAgendamento('${ag.id}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAgendamento('${ag.id}')" title="Excluir">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openNovoAgendamento() {
  document.getElementById('ag-form').reset();
  document.getElementById('ag-form').removeAttribute('data-edit-id');
  document.getElementById('ag-data').value = agFiltroData;
  document.getElementById('ag-modal-title').textContent = '📅 Novo Agendamento';
  // Populate selects
  populateClienteSelect();
  populateTerapeutaSelect();
  openModal('modal-agendamento');
}

function populateClienteSelect(selectedId = '') {
  const sel = document.getElementById('ag-cliente');
  sel.innerHTML = '<option value="">Selecione o cliente...</option>';
  DB.getClientes().sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(c => {
    const op = document.createElement('option');
    op.value = c.id; op.textContent = c.nome + (c.telefone ? ` · ${c.telefone}` : '');
    if (c.id === selectedId) op.selected = true;
    sel.appendChild(op);
  });
}

function populateTerapeutaSelect(selectedId = '') {
  const sel = document.getElementById('ag-terapeuta');
  sel.innerHTML = '<option value="">Selecione a terapeuta...</option>';
  DB.getTerapeutas().sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(t => {
    const op = document.createElement('option');
    op.value = t.id; op.textContent = `${t.emoji||'💆'} ${t.nome}`;
    if (t.id === selectedId) op.selected = true;
    sel.appendChild(op);
  });
}

function editAgendamento(id) {
  const ag = DB.getAgendamento(id);
  if (!ag) return;
  populateClienteSelect(ag.clienteId);
  populateTerapeutaSelect(ag.terapeutaId);
  document.getElementById('ag-data').value = ag.data;
  document.getElementById('ag-hora-inicio').value = ag.horaInicio;
  document.getElementById('ag-hora-fim').value = ag.horaFim;
  document.getElementById('ag-servico').value = ag.servico || '';
  document.getElementById('ag-status').value = ag.status;
  document.getElementById('ag-observacoes').value = ag.observacoes || '';
  document.getElementById('ag-form').setAttribute('data-edit-id', id);
  document.getElementById('ag-modal-title').textContent = '✏️ Editar Agendamento';
  openModal('modal-agendamento');
}

function deleteAgendamento(id) {
  if (!confirm('Excluir este agendamento?')) return;
  DB.deleteAgendamento(id);
  toast('Agendamento excluído', 'info');
  renderAgendamentos();
  loadDashboard();
}

document.getElementById('ag-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const editId = f.getAttribute('data-edit-id');
  const data = document.getElementById('ag-data').value;
  const horaInicio = document.getElementById('ag-hora-inicio').value;
  const horaFim = document.getElementById('ag-hora-fim').value;
  const clienteId = document.getElementById('ag-cliente').value;
  const terapeutaId = document.getElementById('ag-terapeuta').value;
  const status = document.getElementById('ag-status').value;

  if (!clienteId || !terapeutaId || !data || !horaInicio || !horaFim) {
    toast('Preencha todos os campos obrigatórios', 'error'); return;
  }
  if (horaInicio >= horaFim) {
    toast('Horário de início deve ser antes do fim', 'error'); return;
  }
  // Verificar conflito na sala única
  const conflito = DB.checkConflito(data, horaInicio, horaFim, editId || null);
  if (conflito) {
    const tc = DB.getTerapeuta(conflito.terapeutaId);
    toast(`Conflito de sala! ${tc?.nome || 'Outra terapeuta'} já tem sessão às ${conflito.horaInicio}–${conflito.horaFim}`, 'error', '⚠️');
    return;
  }
  const ag = {
    ...(editId ? { id: editId } : {}),
    clienteId, terapeutaId, data, horaInicio, horaFim,
    servico: document.getElementById('ag-servico').value,
    status,
    observacoes: document.getElementById('ag-observacoes').value,
  };
  DB.saveAgendamento(ag);
  toast(editId ? 'Agendamento atualizado!' : 'Agendamento criado!', 'success');
  closeAllModals();
  renderAgendamentos();
  loadDashboard();
});

// ============================================================
// PAGE: CLIENTES
// ============================================================
let clienteSearch = '';

function loadClientes() {
  renderClientes();
}

function renderClientes() {
  const q = clienteSearch.toLowerCase();
  const lista = DB.getClientes().filter(c =>
    !q || c.nome.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.telefone||'').includes(q)
  ).sort((a,b)=>a.nome.localeCompare(b.nome));

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
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="avatar" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117">${c.nome.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600">${c.nome}</div>
            <div class="td-muted" style="font-size:11px">Desde ${formatDate(c.dataCadastro)}</div>
          </div>
        </div>
      </td>
      <td>${c.telefone || '–'}</td>
      <td>${c.email || '–'}</td>
      <td>${ags.length} sessão${ags.length!==1?'ões':''}</td>
      <td>
        <span class="badge ${c.aceiteLgpd ? 'badge-confirmado' : 'badge-cancelado'}">
          ${c.aceiteLgpd ? '✓ Aceito' : '✗ Pendente'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-secondary" onclick="verFichaCliente('${c.id}')" title="Ficha">📋</button>
          <button class="btn btn-sm btn-secondary" onclick="editCliente('${c.id}')" title="Editar">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCliente('${c.id}')" title="Excluir">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openNovoCliente() {
  document.getElementById('cliente-form').reset();
  document.getElementById('cliente-form').removeAttribute('data-edit-id');
  document.getElementById('cliente-modal-title').textContent = '👤 Novo Cliente';
  openModal('modal-cliente');
}

function editCliente(id) {
  const c = DB.getCliente(id);
  if (!c) return;
  document.getElementById('cliente-nome').value = c.nome || '';
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-email').value = c.email || '';
  document.getElementById('cliente-datanascimento').value = c.dataNascimento || '';
  document.getElementById('cliente-lgpd').checked = !!c.aceiteLgpd;
  document.getElementById('cliente-form').setAttribute('data-edit-id', id);
  document.getElementById('cliente-modal-title').textContent = '✏️ Editar Cliente';
  openModal('modal-cliente');
}

function deleteCliente(id) {
  if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return;
  DB.deleteCliente(id);
  toast('Cliente excluído', 'info');
  renderClientes();
}

function verFichaCliente(clienteId) {
  navigate('fichas');
  setTimeout(() => openFichaCliente(clienteId), 100);
}

document.getElementById('cliente-form').addEventListener('submit', e => {
  e.preventDefault();
  const editId = e.target.getAttribute('data-edit-id');
  const lgpd = document.getElementById('cliente-lgpd').checked;
  if (!lgpd) { toast('O cliente precisa aceitar o termo LGPD para ser cadastrado.', 'error'); return; }
  const cliente = {
    ...(editId ? { id: editId } : {}),
    nome: document.getElementById('cliente-nome').value.trim(),
    telefone: document.getElementById('cliente-telefone').value.trim(),
    email: document.getElementById('cliente-email').value.trim(),
    dataNascimento: document.getElementById('cliente-datanascimento').value,
    aceiteLgpd: lgpd,
    dataAceiteLgpd: new Date().toISOString(),
  };
  if (!cliente.nome) { toast('Nome é obrigatório', 'error'); return; }
  DB.saveCliente(cliente);
  toast(editId ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
  closeAllModals();
  renderClientes();
  loadDashboard();
});

// Phone mask
initPhoneMask(document.getElementById('cliente-telefone'));

// ============================================================
// PAGE: TERAPEUTAS
// ============================================================
function loadTerapeutas() { renderTerapeutas(); }

function renderTerapeutas() {
  const lista = DB.getTerapeutas();
  const container = document.getElementById('terapeutas-grid');
  document.getElementById('terapeutas-count').textContent = `${lista.length} terapeuta${lista.length!==1?'s':''}`;
  container.innerHTML = '';
  if (!lista.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px"><div class="emoji">💆</div><h3>Nenhuma terapeuta</h3><p>Cadastre as terapeutas para começar.</p></div>`;
    return;
  }
  lista.forEach(t => {
    const ags = DB.getAgendamentos().filter(a => a.terapeutaId === t.id);
    const agHoje = ags.filter(a => a.data === todayISO() && a.status !== 'cancelado');
    const card = document.createElement('div');
    card.className = 'terapeuta-card';
    card.innerHTML = `
      <div class="terapeuta-header">
        <div class="avatar avatar-lg" style="background:${t.cor||'#6ee7b7'}">${t.emoji||'💆'}</div>
        <div class="terapeuta-info">
          <h3>${t.nome}</h3>
          <p>${t.especialidade || 'Massoterapia'}</p>
        </div>
      </div>
      <div class="terapeuta-stats">
        <div class="terapeuta-stat">
          <div class="val">${agHoje.length}</div>
          <div class="lbl">Hoje</div>
        </div>
        <div class="terapeuta-stat">
          <div class="val">${ags.filter(a=>a.status==='realizado').length}</div>
          <div class="lbl">Total</div>
        </div>
        <div class="terapeuta-stat">
          <div class="val">${ags.filter(a=>a.status!=='cancelado').length}</div>
          <div class="lbl">Ativos</div>
        </div>
      </div>
      <div class="table-actions" style="margin-top:4px">
        <button class="btn btn-sm btn-outline w-full" onclick="editTerapeuta('${t.id}')">✏️ Editar</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTerapeuta('${t.id}')">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function openNovaTerapeuta() {
  document.getElementById('terapeuta-form').reset();
  document.getElementById('terapeuta-form').removeAttribute('data-edit-id');
  document.getElementById('terapeuta-modal-title').textContent = '💆 Nova Terapeuta';
  openModal('modal-terapeuta');
}

function editTerapeuta(id) {
  const t = DB.getTerapeuta(id);
  if (!t) return;
  document.getElementById('terapeuta-nome').value = t.nome || '';
  document.getElementById('terapeuta-especialidade').value = t.especialidade || '';
  document.getElementById('terapeuta-cor').value = t.cor || '#6ee7b7';
  document.getElementById('terapeuta-emoji').value = t.emoji || '💆';
  document.getElementById('terapeuta-form').setAttribute('data-edit-id', id);
  document.getElementById('terapeuta-modal-title').textContent = '✏️ Editar Terapeuta';
  openModal('modal-terapeuta');
}

function deleteTerapeuta(id) {
  if (!confirm('Excluir esta terapeuta? Os agendamentos associados serão mantidos.')) return;
  DB.deleteTerapeuta(id);
  toast('Terapeuta excluída', 'info');
  renderTerapeutas();
}

document.getElementById('terapeuta-form').addEventListener('submit', e => {
  e.preventDefault();
  const editId = e.target.getAttribute('data-edit-id');
  const t = {
    ...(editId ? { id: editId } : {}),
    nome: document.getElementById('terapeuta-nome').value.trim(),
    especialidade: document.getElementById('terapeuta-especialidade').value.trim(),
    cor: document.getElementById('terapeuta-cor').value,
    emoji: document.getElementById('terapeuta-emoji').value.trim() || '💆',
  };
  if (!t.nome) { toast('Nome é obrigatório', 'error'); return; }
  DB.saveTerapeuta(t);
  toast(editId ? 'Terapeuta atualizada!' : 'Terapeuta cadastrada!', 'success');
  closeAllModals();
  renderTerapeutas();
});

// ============================================================
// PAGE: FICHAS
// ============================================================
let fichaClienteAtivo = null;

function loadFichas() {
  renderListaClientesFichas();
}

function renderListaClientesFichas() {
  const lista = DB.getClientes().sort((a,b)=>a.nome.localeCompare(b.nome));
  const container = document.getElementById('fichas-clientes-lista');
  container.innerHTML = '';
  lista.forEach(c => {
    const fichas = DB.getFichasByCliente(c.id);
    const div = document.createElement('div');
    div.className = `nav-item ${fichaClienteAtivo === c.id ? 'active' : ''}`;
    div.style.margin = '4px 0';
    div.innerHTML = `
      <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117;flex-shrink:0">${c.nome.charAt(0)}</div>
      <span style="flex:1;font-size:13px">${c.nome}</span>
      <span class="nav-badge" style="background:var(--bg-hover);color:var(--text-muted)">${fichas.length}</span>
    `;
    div.addEventListener('click', () => openFichaCliente(c.id));
    container.appendChild(div);
  });
  if (!lista.length) {
    container.innerHTML = `<div class="text-muted text-sm" style="padding:16px;text-align:center">Nenhum cliente cadastrado</div>`;
  }
}

function openFichaCliente(clienteId) {
  fichaClienteAtivo = clienteId;
  renderListaClientesFichas();
  const c = DB.getCliente(clienteId);
  const content = document.getElementById('fichas-content');
  if (!c) { content.innerHTML = ''; return; }
  const fichas = DB.getFichasByCliente(clienteId).sort((a,b) => b.dataCriacao.localeCompare(a.dataCriacao));
  const ags = DB.getAgendamentos().filter(a => a.clienteId === clienteId).sort((a,b) => b.data.localeCompare(a.data));
  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="avatar avatar-lg" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117">${c.nome.charAt(0)}</div>
        <div>
          <h2 style="font-size:18px;font-weight:700">${c.nome}</h2>
          <div class="cliente-metarow" style="margin-top:4px">
            ${c.telefone ? `<span>📱 ${c.telefone}</span>` : ''}
            ${c.email ? `<span>📧 ${c.email}</span>` : ''}
            ${c.dataNascimento ? `<span>🎂 ${formatDate(c.dataNascimento)}</span>` : ''}
          </div>
          <div style="margin-top:4px"><span class="badge ${c.aceiteLgpd?'badge-confirmado':'badge-cancelado'}">${c.aceiteLgpd?'✓ LGPD Aceito':'✗ LGPD Pendente'}</span></div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="openNovaFicha('${c.id}')">+ Nova Anotação</button>
    </div>
    <div class="grid-2" style="gap:24px">
      <div>
        <div class="section-title" style="margin-bottom:14px">📝 Fichas & Anotações (${fichas.length})</div>
        ${fichas.length ? fichas.map(f => `
          <div class="ficha-card">
            <div class="ficha-date">${formatDateTime(f.dataCriacao)} ${f.terapeutaId ? `· ${DB.getTerapeuta(f.terapeutaId)?.nome||''}` : ''}</div>
            ${f.queixa ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Queixa: <strong style="color:var(--gold)">${f.queixa}</strong></div>` : ''}
            <div class="ficha-body">${f.conteudo || '–'}</div>
            ${f.contraindicacoes ? `<div style="margin-top:8px;font-size:12px;color:var(--red)">⚠️ ${f.contraindicacoes}</div>` : ''}
          </div>
        `).join('') : '<div class="empty-state" style="padding:30px"><div class="emoji">📝</div><h3>Sem anotações</h3></div>'}
      </div>
      <div>
        <div class="section-title" style="margin-bottom:14px">📅 Histórico de Sessões (${ags.length})</div>
        <div class="timeline">
        ${ags.length ? ags.slice(0, 12).map(a => {
          const t = DB.getTerapeuta(a.terapeutaId);
          return `<div class="timeline-item">
            <div class="timeline-dot" style="background:${t?.cor||'#6ee7b7'}"></div>
            <div class="timeline-content">
              <div class="timeline-time">${formatDate(a.data)} ${a.horaInicio}–${a.horaFim} <span class="badge badge-${a.status}">${a.status}</span></div>
              <div class="timeline-text"><strong>${a.servico||'Sessão'}</strong> com <strong>${t?.nome||'–'}</strong></div>
            </div>
          </div>`;
        }).join('') : '<div class="empty-state" style="padding:20px"><div class="emoji">📅</div><h3>Sem sessões</h3></div>'}
        </div>
      </div>
    </div>
  `;
}

function openNovaFicha(clienteId) {
  document.getElementById('ficha-form').reset();
  document.getElementById('ficha-cliente-id').value = clienteId;
  populateTerapeutaSelectFicha();
  openModal('modal-ficha');
}

function populateTerapeutaSelectFicha() {
  const sel = document.getElementById('ficha-terapeuta');
  sel.innerHTML = '<option value="">Selecione a terapeuta...</option>';
  DB.getTerapeutas().forEach(t => {
    const op = document.createElement('option');
    op.value = t.id; op.textContent = `${t.emoji||'💆'} ${t.nome}`;
    sel.appendChild(op);
  });
}

document.getElementById('ficha-form').addEventListener('submit', e => {
  e.preventDefault();
  const clienteId = document.getElementById('ficha-cliente-id').value;
  const ficha = {
    clienteId,
    terapeutaId: document.getElementById('ficha-terapeuta').value,
    queixa: document.getElementById('ficha-queixa').value.trim(),
    conteudo: document.getElementById('ficha-conteudo').value.trim(),
    contraindicacoes: document.getElementById('ficha-contra').value.trim(),
  };
  if (!ficha.conteudo) { toast('Adicione o conteúdo da ficha', 'error'); return; }
  DB.saveFicha(ficha);
  toast('Ficha salva!', 'success');
  closeAllModals();
  openFichaCliente(clienteId);
});

// ============================================================
// PAGE: RELATÓRIOS
// ============================================================
function loadRelatorios() {
  const ags = DB.getAgendamentos();
  const hoje = todayISO();
  const mes = hoje.slice(0, 7);

  const agMes    = ags.filter(a => a.data?.startsWith(mes));
  const realiz   = ags.filter(a => a.status === 'realizado');
  const cancelad = ags.filter(a => a.status === 'cancelado');
  const pendentes = ags.filter(a => ['agendado','confirmado'].includes(a.status) && a.data >= hoje);

  document.getElementById('rel-total').textContent   = ags.length;
  document.getElementById('rel-mes').textContent      = agMes.length;
  document.getElementById('rel-realiz').textContent   = realiz.length;
  document.getElementById('rel-cancel').textContent   = cancelad.length;
  document.getElementById('rel-pendentes').textContent = pendentes.length;
  document.getElementById('rel-clientes').textContent = DB.getClientes().length;
  document.getElementById('rel-lgpd').textContent     = DB.getClientes().filter(c=>c.aceiteLgpd).length;

  // Por terapeuta
  const tContainer = document.getElementById('rel-terapeutas');
  tContainer.innerHTML = '';
  DB.getTerapeutas().forEach(t => {
    const ta = ags.filter(a => a.terapeutaId === t.id);
    const taR = ta.filter(a => a.status === 'realizado');
    const taM = ta.filter(a => a.data?.startsWith(mes));
    const div = document.createElement('div');
    div.className = 'card card-sm flex gap-4';
    div.style.cssText = 'display:flex;align-items:center;gap:16px;margin-bottom:10px';
    div.innerHTML = `
      <div class="avatar" style="background:${t.cor||'#6ee7b7'}">${t.emoji||'💆'}</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:14px">${t.nome}</div>
        <div class="td-muted">${t.especialidade||''}</div>
      </div>
      <div style="display:flex;gap:20px;text-align:center">
        <div><div style="font-size:20px;font-weight:700;color:var(--green-300)">${taM.length}</div><div class="text-xs text-muted">este mês</div></div>
        <div><div style="font-size:20px;font-weight:700;color:var(--blue)">${taR.length}</div><div class="text-xs text-muted">realizados</div></div>
        <div><div style="font-size:20px;font-weight:700">${ta.length}</div><div class="text-xs text-muted">total</div></div>
      </div>
    `;
    tContainer.appendChild(div);
  });
}

// ============================================================
// PAGE LOADERS MAP
// ============================================================
const pageLoaders = {
  dashboard: loadDashboard,
  agendamentos: loadAgendamentos,
  clientes: loadClientes,
  terapeutas: loadTerapeutas,
  fichas: loadFichas,
  relatorios: loadRelatorios,
};

// ============================================================
// EVENT LISTENERS – NAV
// ============================================================
$$('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// Agendamentos filters
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

// Cliente search
document.getElementById('cliente-search-input').addEventListener('input', e => {
  clienteSearch = e.target.value;
  renderClientes();
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  DB.seedDemo();
  navigate('dashboard');
});
