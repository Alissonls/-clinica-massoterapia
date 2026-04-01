/** fichas.js — Módulo de Fichas de Pacientes */
import { DB } from '../core/db.js';
import { sanitizeHTML, sanitizeText } from '../core/security.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';
import { toast } from '../utils/toast.js';
import { openModal, closeAllModals } from '../utils/modal.js';

export let fichaClienteAtivo = null;

export function loadFichas() { renderListaClientesFichas(); }

export function renderListaClientesFichas() {
  const lista = DB.getClientes().sort((a,b) => a.nome.localeCompare(b.nome));
  const container = document.getElementById('fichas-clientes-lista');
  container.innerHTML = '';
  if (!lista.length) {
    container.innerHTML = `<div class="text-muted text-sm" style="padding:16px;text-align:center">Nenhum cliente cadastrado</div>`;
    return;
  }
  lista.forEach(c => {
    const fichas = DB.getFichasByCliente(c.id);
    const div = document.createElement('div');
    div.className = `nav-item ${fichaClienteAtivo === c.id ? 'active' : ''}`;
    div.style.margin = '4px 0';
    div.innerHTML = `
      <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117;flex-shrink:0">${sanitizeHTML(c.nome.charAt(0))}</div>
      <span style="flex:1;font-size:13px">${sanitizeHTML(c.nome)}</span>
      <span class="nav-badge" style="background:var(--bg-hover);color:var(--text-muted)">${fichas.length}</span>`;
    div.addEventListener('click', () => openFichaCliente(c.id));
    container.appendChild(div);
  });
}

export function openFichaCliente(clienteId) {
  fichaClienteAtivo = clienteId;
  renderListaClientesFichas();
  const c = DB.getCliente(clienteId);
  const content = document.getElementById('fichas-content');
  if (!c) { content.innerHTML = ''; return; }

  const fichas = DB.getFichasByCliente(clienteId).sort((a,b) => b.dataCriacao.localeCompare(a.dataCriacao));
  const ags    = DB.getAgendamentos().filter(a => a.clienteId === clienteId).sort((a,b) => b.data.localeCompare(a.data));

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="avatar avatar-lg" style="background:linear-gradient(135deg,#6ee7b7,#059669);color:#0d1117">${sanitizeHTML(c.nome.charAt(0))}</div>
        <div>
          <h2 style="font-size:18px;font-weight:700">${sanitizeHTML(c.nome)}</h2>
          <div class="cliente-metarow" style="margin-top:4px">
            ${c.telefone ? `<span>📱 ${sanitizeHTML(c.telefone)}</span>` : ''}
            ${c.email    ? `<span>📧 ${sanitizeHTML(c.email)}</span>` : ''}
            ${c.dataNascimento ? `<span>🎂 ${formatDate(c.dataNascimento)}</span>` : ''}
          </div>
          <div style="margin-top:4px"><span class="badge ${c.aceiteLgpd?'badge-confirmado':'badge-cancelado'}">${c.aceiteLgpd?'✓ LGPD Aceito':'✗ LGPD Pendente'}</span></div>
        </div>
      </div>
      <button class="btn btn-primary" id="btn-nova-anotacao">+ Nova Anotação</button>
    </div>
    <div class="grid-2" style="gap:24px">
      <div>
        <div class="section-title" style="margin-bottom:14px">📝 Fichas & Anotações (${fichas.length})</div>
        ${fichas.length ? fichas.map(f => `
          <div class="ficha-card">
            <div class="ficha-date">${formatDateTime(f.dataCriacao)} ${f.terapeutaId ? `· ${sanitizeHTML(DB.getTerapeuta(f.terapeutaId)?.nome||'')}` : ''}</div>
            ${f.queixa ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Queixa: <strong style="color:var(--gold)">${sanitizeHTML(f.queixa)}</strong></div>` : ''}
            <div class="ficha-body">${sanitizeHTML(f.conteudo||'–')}</div>
            ${f.contraindicacoes ? `<div style="margin-top:8px;font-size:12px;color:var(--red)">⚠️ ${sanitizeHTML(f.contraindicacoes)}</div>` : ''}
          </div>`).join('') : '<div class="empty-state" style="padding:30px"><div class="emoji">📝</div><h3>Sem anotações</h3></div>'}
      </div>
      <div>
        <div class="section-title" style="margin-bottom:14px">📅 Histórico de Sessões (${ags.length})</div>
        <div class="timeline">
          ${ags.slice(0, 12).map(a => {
            const t = DB.getTerapeuta(a.terapeutaId);
            return `<div class="timeline-item">
              <div class="timeline-dot" style="background:${sanitizeHTML(t?.cor||'#6ee7b7')}"></div>
              <div class="timeline-content">
                <div class="timeline-time">${formatDate(a.data)} ${sanitizeHTML(a.horaInicio)}–${sanitizeHTML(a.horaFim)} <span class="badge badge-${sanitizeHTML(a.status)}">${sanitizeHTML(a.status)}</span></div>
                <div class="timeline-text"><strong>${sanitizeHTML(a.servico||'Sessão')}</strong> com <strong>${sanitizeHTML(t?.nome||'–')}</strong></div>
              </div></div>`;
          }).join('')}
          ${!ags.length ? '<div class="empty-state" style="padding:20px"><div class="emoji">📅</div><h3>Sem sessões</h3></div>' : ''}
        </div>
      </div>
    </div>`;

  document.getElementById('btn-nova-anotacao')?.addEventListener('click', () => openNovaFicha(c.id));
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

export function openNovaFicha(clienteId) {
  document.getElementById('ficha-form').reset();
  document.getElementById('ficha-cliente-id').value = clienteId;
  populateTerapeutaSelectFicha();
  openModal('modal-ficha');
}

export function initFichasForm() {
  document.getElementById('ficha-form').addEventListener('submit', async e => {
    e.preventDefault();
    const clienteId = document.getElementById('ficha-cliente-id').value;
    const ficha = {
      clienteId,
      terapeutaId:      document.getElementById('ficha-terapeuta').value,
      queixa:           sanitizeText(document.getElementById('ficha-queixa').value),
      conteudo:         sanitizeText(document.getElementById('ficha-conteudo').value),
      contraindicacoes: sanitizeText(document.getElementById('ficha-contra').value),
    };
    if (!ficha.conteudo) { toast('Adicione o conteúdo da ficha', 'error'); return; }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;

    try {
      await DB.saveFicha(ficha);
      toast('Ficha salva!', 'success');
      closeAllModals();
      openFichaCliente(clienteId);
    } catch(err) { toast('Erro ao salvar', 'error'); } finally {
      submitBtn.textContent = originalText; submitBtn.disabled = false;
    }
  });

  document.addEventListener('abrirFichaCliente', e => openFichaCliente(e.detail.clienteId));
}
