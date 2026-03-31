/** dashboard.js — Módulo de Dashboard */
import { DB } from '../core/db.js';
import { sanitizeHTML } from '../core/security.js';
import { formatDate, todayISO } from '../utils/formatters.js';
import { navigate } from '../core/router.js';

export function loadDashboard() {
  const ags  = DB.getAgendamentos();
  const hoje = todayISO();
  const agHoje   = ags.filter(a => a.data === hoje && a.status !== 'cancelado');
  const agSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    const limit = d.toISOString().slice(0, 10);
    return ags.filter(a => a.data >= hoje && a.data <= limit && a.status !== 'cancelado');
  })();

  document.getElementById('stat-hoje').textContent      = agHoje.length;
  document.getElementById('stat-semana').textContent    = agSemana.length;
  document.getElementById('stat-clientes').textContent  = DB.getClientes().length;
  document.getElementById('stat-terapeutas').textContent = DB.getTerapeutas().length;

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
  agFuturos.forEach(ag => {
    const cliente   = DB.getCliente(ag.clienteId);
    const terapeuta = DB.getTerapeuta(ag.terapeutaId);
    const isHoje = ag.data === hoje;
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.innerHTML = `
      <div class="timeline-dot" style="background:${sanitizeHTML(terapeuta?.cor || '#6ee7b7')}"></div>
      <div class="timeline-content">
        <div class="timeline-time">${isHoje ? 'Hoje' : formatDate(ag.data)} · ${sanitizeHTML(ag.horaInicio)}–${sanitizeHTML(ag.horaFim)} · <span class="badge badge-${sanitizeHTML(ag.status)}">${sanitizeHTML(ag.status)}</span></div>
        <div class="timeline-text"><strong>${sanitizeHTML(cliente?.nome || 'Cliente')}</strong> com <strong>${sanitizeHTML(terapeuta?.nome || 'Terapeuta')}</strong>${ag.servico ? ` <span class="text-muted">· ${sanitizeHTML(ag.servico)}</span>` : ''}</div>
      </div>`;
    container.appendChild(el);
  });
}
