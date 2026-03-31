/**
 * formatters.js — Utilitários de formatação de dados
 * @module formatters
 */

/**
 * Formata data ISO para dd/mm/yyyy (sem API de locale).
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return '–';
  const str = iso.split('T')[0];
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formata data-hora ISO para dd/mm/yyyy HH:MM.
 * @param {string} iso
 * @returns {string}
 */
export function formatDateTime(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formata número para telefone brasileiro (10 ou 11 dígitos).
 * @param {string} v
 * @returns {string}
 */
export function formatPhone(v) {
  if (!v) return '';
  const digits = v.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

/**
 * Aplica máscara de telefone em tempo real em um input.
 * @param {HTMLInputElement} input
 */
export function initPhoneMask(input) {
  input.addEventListener('input', () => { input.value = formatPhone(input.value); });
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
