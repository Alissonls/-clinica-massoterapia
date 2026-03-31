/** 
 * auth.js — Autenticação do Usuário (SaaS)
 * Por enquanto as funções são mocks estruturais aguardando as chaves do Firebase.
 */
import { toast } from '../utils/toast.js';

export let currentUser = null; // null se não logado, ou { id: '...', email: '...' }

let onAuthStateChangedCallback = null;

// Escutar mudança de estado de login (será ligado ao Firebase depois)
export function onAuthStateChanged(cb) {
  onAuthStateChangedCallback = cb;
  // Simula estado inicial deslogado após 500ms
  setTimeout(() => cb(null), 500);
}

export function registrar(email, senha) {
  toast('Configuração do Banco de Dados necessária para criar contas.', 'warning');
}

export function logar(email, senha) {
  toast('Configuração do Banco de Dados necessária para login.', 'warning');
}

export function logout() {
  currentUser = null;
  if(onAuthStateChangedCallback) onAuthStateChangedCallback(null);
  toast('Você saiu da conta', 'info');
}

// Para usar apenas quando o firebase estiver pronto
export function _simMockLogin(email) {
  currentUser = { id: 'usuario-' + email, email };
  if(onAuthStateChangedCallback) onAuthStateChangedCallback(currentUser);
}
