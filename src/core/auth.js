/** 
 * auth.js — Autenticação do Usuário (SaaS)
 * Integração Real com o Firebase Auth
 */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { toast } from '../utils/toast.js';

export let currentUser = null;

let onAuthStateChangedCallback = null;

// Ouve as mudanças de estado do Firebase Oficialmente
firebaseOnAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = { id: user.uid, email: user.email };
  } else {
    currentUser = null;
  }
  if (onAuthStateChangedCallback) {
    onAuthStateChangedCallback(currentUser);
  }
});

export function onAuthStateChanged(cb) {
  onAuthStateChangedCallback = cb;
  // Já chama com o estado atual caso já esteja inicializado
  if (auth.currentUser) {
    cb({ id: auth.currentUser.uid, email: auth.currentUser.email });
  }
}

export async function registrar(email, senha) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    toast('Conta criada com sucesso! Redirecionando...', 'success');
    return cred.user;
  } catch (err) {
    toast(`Erro ao criar conta: ${err.message}`, 'error');
    throw err;
  }
}

export async function logar(email, senha) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    toast('Login realizado!', 'success');
    return cred.user;
  } catch (err) {
    toast('E-mail ou senha incorretos.', 'error');
    throw err;
  }
}

export async function logout() {
  try {
    await signOut(auth);
    toast('Você saiu da conta', 'info');
  } catch(err) {
    toast('Erro ao sair da conta.', 'error');
  }
}

// Para retrocompatibilidade (será removido em breve caso não seja usado)
export function _simMockLogin(email) {
  toast('O Mock Login foi desativado. Use a senha real.', 'warning');
}
