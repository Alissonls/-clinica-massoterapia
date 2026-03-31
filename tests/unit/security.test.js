// ============================================================
// security.test.js — Testes do módulo de segurança
// ============================================================
import {
  sanitizeHTML, sanitizeText,
  validateEmail, validatePhone,
  validateTimeRange,
  sanitizeClienteInput, sanitizeAgendamentoInput,
} from '../../src/core/security.js';

// ── sanitizeHTML ──────────────────────────────────────────────
describe('sanitizeHTML', () => {
  test('escapa < e >', () => {
    expect(sanitizeHTML('<script>')).toBe('&lt;script&gt;');
  });

  test('escapa aspas duplas', () => {
    expect(sanitizeHTML('"valor"')).toBe('&quot;valor&quot;');
  });

  test('escapa aspas simples', () => {
    expect(sanitizeHTML("'valor'")).toBe('&#39;valor&#39;');
  });

  test('escapa &', () => {
    expect(sanitizeHTML('a & b')).toBe('a &amp; b');
  });

  test('escapa barra /', () => {
    expect(sanitizeHTML('a/b')).toBe('a&#x2F;b');
  });

  test('bloqueia ataque XSS common pattern', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const result = sanitizeHTML(xss);
    // As tags são escapadas — não deve existir HTML executável
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
    expect(result).toContain('&gt;');
  });

  test('retorna string vazia para null', () => {
    expect(sanitizeHTML(null)).toBe('');
  });

  test('retorna string vazia para undefined', () => {
    expect(sanitizeHTML(undefined)).toBe('');
  });

  test('não modifica texto sem caracteres especiais', () => {
    expect(sanitizeHTML('Olá Mundo 123')).toBe('Olá Mundo 123');
  });
});

// ── sanitizeText ──────────────────────────────────────────────
describe('sanitizeText', () => {
  test('remove tags < e >', () => {
    // sanitizeText remove < e > mas mantém o restante do texto
    expect(sanitizeText('<b>Negrito</b>')).toBe('bNegrito/b');
  });

  test('remove espaços extras', () => {
    expect(sanitizeText('  texto   com   espaços  ')).toBe('texto com espaços');
  });

  test('retorna string vazia para falsy', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
  });
});

// ── validateEmail ─────────────────────────────────────────────
describe('validateEmail', () => {
  test('aceita e-mails válidos', () => {
    expect(validateEmail('usuario@email.com')).toBe(true);
    expect(validateEmail('nome.sobrenome@empresa.com.br')).toBe(true);
    expect(validateEmail('user+tag@domain.org')).toBe(true);
  });

  test('rejeita e-mails inválidos', () => {
    expect(validateEmail('semdominio')).toBe(false);
    expect(validateEmail('falta@')).toBe(false);
    expect(validateEmail('@semlocal.com')).toBe(false);
    expect(validateEmail('duplo@@dominio.com')).toBe(false);
  });

  test('aceita campo vazio (opcional)', () => {
    expect(validateEmail('')).toBe(true);
    expect(validateEmail(null)).toBe(true);
    expect(validateEmail(undefined)).toBe(true);
  });
});

// ── validatePhone ─────────────────────────────────────────────
describe('validatePhone', () => {
  test('aceita celular com 11 dígitos', () => {
    expect(validatePhone('(11) 91234-5678')).toBe(true);
    expect(validatePhone('11912345678')).toBe(true);
  });

  test('aceita fixo com 10 dígitos', () => {
    expect(validatePhone('(11) 3456-7890')).toBe(true);
    expect(validatePhone('1134567890')).toBe(true);
  });

  test('rejeita telefone com poucos dígitos', () => {
    expect(validatePhone('999')).toBe(false);
    expect(validatePhone('123456789')).toBe(false); // 9 dígitos
  });

  test('aceita campo vazio (opcional)', () => {
    expect(validatePhone('')).toBe(true);
    expect(validatePhone(null)).toBe(true);
  });
});

// ── validateTimeRange ─────────────────────────────────────────
describe('validateTimeRange', () => {
  test('aceita início < fim', () => {
    expect(validateTimeRange('09:00', '10:00')).toBe(true);
    expect(validateTimeRange('08:30', '08:45')).toBe(true);
  });

  test('rejeita início >= fim', () => {
    expect(validateTimeRange('10:00', '09:00')).toBe(false);
    expect(validateTimeRange('10:00', '10:00')).toBe(false);
  });

  test('rejeita valores nulos/vazios', () => {
    expect(validateTimeRange('', '10:00')).toBe(false);
    expect(validateTimeRange('09:00', '')).toBe(false);
    expect(validateTimeRange(null, null)).toBe(false);
  });
});

// ── sanitizeClienteInput ──────────────────────────────────────
describe('sanitizeClienteInput', () => {
  test('sanitiza campos de texto do cliente', () => {
    const result = sanitizeClienteInput({
      nome: '  <João>  ',
      email: '  <test>@site.com  ',
      telefone: ' <(11)> 91234-5678 ',
    });
    expect(result.nome).not.toContain('<');
    expect(result.email).not.toContain('<');
    expect(result.telefone).not.toContain('<');
  });

  test('preserva campos não-texto', () => {
    const result = sanitizeClienteInput({ nome: 'Maria', aceiteLgpd: true, dataAceiteLgpd: '2026-01-01' });
    expect(result.aceiteLgpd).toBe(true);
    expect(result.dataAceiteLgpd).toBe('2026-01-01');
  });
});
