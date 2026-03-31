/**
 * security.js — Módulo de Segurança
 * Sanitização de inputs e prevenção de XSS.
 * @module security
 */

const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;' };

/**
 * Escapa caracteres HTML perigosos prevenindo XSS.
 * Use sempre que inserir texto de usuário em innerHTML.
 * @param {*} str
 * @returns {string}
 */
export function sanitizeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'/]/g, m => HTML_ESCAPE_MAP[m]);
}

/**
 * Remove tags e normaliza espaços de texto puro.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeText(str) {
  if (!str) return '';
  return String(str).trim().replace(/[<>]/g, '').replace(/\s+/g, ' ');
}

/**
 * Valida formato de e-mail (campo opcional).
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') return true;
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Valida telefone brasileiro (campo opcional, 10-11 dígitos).
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === '') return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

/**
 * Verifica se início < fim no formato "HH:MM".
 * @param {string} inicio
 * @param {string} fim
 * @returns {boolean}
 */
export function validateTimeRange(inicio, fim) {
  if (!inicio || !fim) return false;
  return inicio < fim;
}

/**
 * Sanitiza campos textuais de um objeto cliente.
 * @param {Object} cliente
 * @returns {Object}
 */
export function sanitizeClienteInput(cliente) {
  return {
    ...cliente,
    nome:     sanitizeText(cliente.nome     || ''),
    email:    sanitizeText(cliente.email    || ''),
    telefone: sanitizeText(cliente.telefone || ''),
  };
}

/**
 * Sanitiza campos textuais de um agendamento.
 * @param {Object} ag
 * @returns {Object}
 */
export function sanitizeAgendamentoInput(ag) {
  return {
    ...ag,
    servico:     sanitizeText(ag.servico     || ''),
    observacoes: sanitizeText(ag.observacoes || ''),
  };
}

/**
 * Rate limiting básico via localStorage.
 * Retorna false se o limite for atingido.
 * @param {string} key
 * @param {number} maxOps
 * @param {number} windowMs
 * @returns {boolean}
 */
export function rateLimitCheck(key, maxOps = 20, windowMs = 60_000) {
  const storageKey = `_rl_${key}`;
  try {
    const raw  = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : { count: 0, resetAt: Date.now() + windowMs };
    if (Date.now() > data.resetAt) { data.count = 0; data.resetAt = Date.now() + windowMs; }
    if (data.count >= maxOps) return false;
    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch { return true; }
}
