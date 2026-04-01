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
import { onAuthStateChanged, logar, registrar, logout } from './core/auth.js';

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
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  
  const loginBox = document.getElementById('login-box');
  const registerBox = document.getElementById('register-box');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Alternar entre Telas de Auth
  document.getElementById('link-show-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
  });

  document.getElementById('link-show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
  });

  // Flow: Login
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-login-submit');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Carregando...'; btnSubmit.disabled = true;
    try {
      await logar(document.getElementById('login-email').value.trim(), document.getElementById('login-senha').value);
    } catch (err) {} finally { btnSubmit.disabled = false; btnSubmit.textContent = originalText; }
  });

  // Flow: Cadastro
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const senha = document.getElementById('register-senha').value;
    const senhaConfirm = document.getElementById('register-senha-conf').value;

    if (senha !== senhaConfirm) {
      toast('As senhas não coincidem.', 'error');
      return;
    }

    const btnSubmit = document.getElementById('btn-register-submit');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = 'Criando conta...'; btnSubmit.disabled = true;
    try {
      await registrar(email, senha);
    } catch (err) {} finally { btnSubmit.disabled = false; btnSubmit.textContent = originalText; }
  });

  onAuthStateChanged(async (user) => {
    if (user) {
      // Temporarily show full-screen loading skeleton for the app
      authScreen.classList.add('hidden');
      
      const appWrapper = document.createElement('div');
      appWrapper.id = 'temp-loader';
      appWrapper.style.cssText = 'position:fixed;inset:0;background:var(--bg-app);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
      appWrapper.innerHTML = `<div class="emoji" style="font-size:40px;margin-bottom:12px;animation:pulse 1.5s infinite">🌿</div>
                              <h3 style="color:var(--text-main)">Conectando ao SaaS...</h3>
                              <p style="color:var(--text-muted);font-size:13px">Baixando dados seguros da nuvem</p>`;
      document.body.appendChild(appWrapper);

      try {
        await DB.initCache(user.id);
        appShell.classList.remove('hidden');
        navigate('dashboard');
      } catch (e) {
        toast('Erro ao sincronizar dados', 'error');
        logout(); // Force logout se falhar ao inicializar banco
      } finally {
        document.getElementById('temp-loader')?.remove();
      }
    } else {
      DB.clearCache();
      appShell.classList.add('hidden');
      authScreen.classList.remove('hidden');
    }
  });
});
