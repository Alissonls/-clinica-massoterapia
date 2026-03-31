/** relatorios.js — Módulo de Relatórios */
import { DB } from '../core/db.js';
import { sanitizeHTML } from '../core/security.js';
import { todayISO } from '../utils/formatters.js';

export function loadRelatorios() {
  const ags = DB.getAgendamentos();
  const hoje = todayISO();
  const mes  = hoje.slice(0, 7);

  document.getElementById('rel-total').textContent    = ags.length;
  document.getElementById('rel-mes').textContent      = ags.filter(a => a.data?.startsWith(mes)).length;
  document.getElementById('rel-realiz').textContent   = ags.filter(a => a.status === 'realizado').length;
  document.getElementById('rel-cancel').textContent   = ags.filter(a => a.status === 'cancelado').length;
  document.getElementById('rel-pendentes').textContent = ags.filter(a => ['agendado','confirmado'].includes(a.status) && a.data >= hoje).length;
  document.getElementById('rel-clientes').textContent = DB.getClientes().length;
  document.getElementById('rel-lgpd').textContent     = DB.getClientes().filter(c => c.aceiteLgpd).length;

  const tContainer = document.getElementById('rel-terapeutas');
  tContainer.innerHTML = '';
  DB.getTerapeutas().forEach(t => {
    const ta  = ags.filter(a => a.terapeutaId === t.id);
    const taR = ta.filter(a => a.status === 'realizado');
    const taM = ta.filter(a => a.data?.startsWith(mes));
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:16px;margin-bottom:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px';
    div.innerHTML = `
      <div class="avatar" style="background:${sanitizeHTML(t.cor||'#6ee7b7')}">${sanitizeHTML(t.emoji||'💆')}</div>
      <div style="flex:1"><div style="font-weight:600;font-size:14px">${sanitizeHTML(t.nome)}</div><div class="td-muted">${sanitizeHTML(t.especialidade||'')}</div></div>
      <div style="display:flex;gap:20px;text-align:center">
        <div><div style="font-size:20px;font-weight:700;color:var(--green-300)">${taM.length}</div><div class="text-xs text-muted">este mês</div></div>
        <div><div style="font-size:20px;font-weight:700;color:var(--blue)">${taR.length}</div><div class="text-xs text-muted">realizados</div></div>
        <div><div style="font-size:20px;font-weight:700">${ta.length}</div><div class="text-xs text-muted">total</div></div>
      </div>`;
    tContainer.appendChild(div);
  });
}
