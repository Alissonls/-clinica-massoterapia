/**
 * app.js — Entry Point da Aplicação
 * Importa e inicializa todos os módulos do sistema SAP.
 */

// ── Core ──────────────────────────────────────────────────────
import { DB }                                 from './core/db.js';
import { navigate, registerPageLoader, currentPage } from './core/router.js';

// ── Utils ─────────────────────────────────────────────────────
import { initModals }                         from './utils/modal.js';
import { $$ }                                 from './utils/dom.js';
import { toast }                              from './utils/toast.js';

// ── Auth (SaaS) ───────────────────────────────────────────────
import { onAuthStateChanged, _simMockLogin, logout } from './core/auth.js';

// ── Módulos de Página ─────────────────────────────────────────
import { loadDashboard }                       from './modules/dashboard.js';
import { loadAgendamentos, openNovoAgendamento, initAgendamentosForm } from './modules/agendamentos.js';
import { loadClientes, openNovoCliente, initClientesForm }             from './modules/clientes.js';
import { loadTerapeutas, openNovaTerapeuta, initTerapeutasForm }       from './modules/terapeutas.js';
import { loadFichas, openNovaFicha, initFichasForm }                   from './modules/fichas.js';
import { loadRelatorios }                      from './modules/relatorios.js';

// ── Registrar Page Loaders ────────────────────────────────────
registerPageLoader('dashboard',    loadDashboard);
registerPageLoader('agendamentos', loadAgendamentos);
registerPageLoader('clientes',     loadClientes);
registerPageLoader('terapeutas',   loadTerapeutas);
registerPageLoader('fichas',       loadFichas);
registerPageLoader('relatorios',   loadRelatorios);

// ── Inicializar Formulários / Listeners ───────────────────────
initModals();
initAgendamentosForm();
initClientesForm();
initTerapeutasForm();
initFichasForm();

// ── Nav: Event listeners ──────────────────────────────────────
$$('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// ── Botões fixos: Sidebar + Topbar ──────────────────────────
document.getElementById('btn-sidebar-agendar')?.addEventListener('click', openNovoAgendamento);
document.getElementById('btn-sidebar-cliente')?.addEventListener('click', openNovoCliente);
document.getElementById('btn-topbar-agendar')?.addEventListener('click', openNovoAgendamento);
document.getElementById('btn-topbar-cliente')?.addEventListener('click', openNovoCliente);
document.getElementById('btn-ver-agendamentos')?.addEventListener('click', () => navigate('agendamentos'));
document.getElementById('btn-novo-agendamento')?.addEventListener('click', openNovoAgendamento);
document.getElementById('btn-novo-cliente')?.addEventListener('click', openNovoCliente);
document.getElementById('btn-nova-terapeuta')?.addEventListener('click', openNovaTerapeuta);

// ── Logout ────────────────────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', logout);

// ── Init & Auth Listener ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  
  // Login Form Submission
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    _simMockLogin(email);
  });

  onAuthStateChanged(user => {
    if (user) {
      // Logado: oculta login, mostra app e carrega primeira página
      loginScreen.classList.add('hidden');
      appShell.classList.remove('hidden');
      DB.seedDemo(); // Pode ser removido quando houver DB na nuvem
      navigate('dashboard');
    } else {
      // Não logado: mostra tela de login
      appShell.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    }
  });
});
