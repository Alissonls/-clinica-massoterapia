// ============================================================
// formatters.test.js — Testes dos utilitários de formatação
// ============================================================
import { formatDate, formatDateTime, formatPhone, todayISO } from '../../src/utils/formatters.js';

// ── formatDate ────────────────────────────────────────────────
describe('formatDate', () => {
  test('formata data ISO para dd/mm/yyyy', () => {
    expect(formatDate('2026-03-15')).toBe('15/03/2026');
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
    expect(formatDate('2026-12-31')).toBe('31/12/2026');
  });

  test('ignora a parte do horário da ISO string', () => {
    expect(formatDate('2026-06-20T10:30:00.000Z')).toBe('20/06/2026');
  });

  test('retorna traço para valor vazio', () => {
    expect(formatDate('')).toBe('–');
    expect(formatDate(null)).toBe('–');
    expect(formatDate(undefined)).toBe('–');
  });
});

// ── formatPhone ───────────────────────────────────────────────
describe('formatPhone', () => {
  test('formata celular com 11 dígitos', () => {
    expect(formatPhone('11912345678')).toBe('(11) 91234-5678');
  });

  test('formata fixo com 10 dígitos', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });

  test('formata entrada com máscara existente', () => {
    expect(formatPhone('(11) 91234-5678')).toBe('(11) 91234-5678');
  });

  test('retorna vazio para input falsy', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone(null)).toBe('');
  });

  test('trunca mais de 11 dígitos', () => {
    const result = formatPhone('119123456789999');
    const digits = result.replace(/\D/g, '');
    expect(digits.length).toBeLessThanOrEqual(11);
  });
});

// ── todayISO ──────────────────────────────────────────────────
describe('todayISO', () => {
  test('retorna string no formato YYYY-MM-DD', () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('retorna data de hoje', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(todayISO()).toBe(today);
  });
});
