// ============================================================
// conflito.test.js — Testes de conflito de sala única
// Cobre todos os cenários de sobreposição de horários.
// ============================================================
import { DB } from '../../src/core/db.js';

const DATA = '2026-05-10';

function criarAg(horaInicio, horaFim, status = 'agendado') {
  return DB.saveAgendamento({
    clienteId: 'c1', terapeutaId: 't1',
    data: DATA, horaInicio, horaFim, status,
  });
}

describe('DB.checkConflito — Sala Única', () => {
  // ── Sem conflito ────────────────────────────────────────────
  test('sem conflito quando não há agendamentos', () => {
    expect(DB.checkConflito(DATA, '09:00', '10:00')).toBeNull();
  });

  test('sem conflito para horários adjacentes (um após o outro)', () => {
    criarAg('08:00', '09:00');
    expect(DB.checkConflito(DATA, '09:00', '10:00')).toBeNull();
  });

  test('sem conflito para horários em datas diferentes', () => {
    criarAg('09:00', '10:00');
    expect(DB.checkConflito('2026-05-11', '09:00', '10:00')).toBeNull();
  });

  test('sem conflito quando agendamento existente está cancelado', () => {
    criarAg('09:00', '10:00', 'cancelado');
    expect(DB.checkConflito(DATA, '09:00', '10:00')).toBeNull();
  });

  test('sem conflito ao excluir o próprio agendamento (excludeId)', () => {
    const ag = criarAg('09:00', '10:00');
    expect(DB.checkConflito(DATA, '09:00', '10:00', ag.id)).toBeNull();
  });

  // ── Com conflito ────────────────────────────────────────────
  test('detecta sobreposição total (mesmo horário)', () => {
    criarAg('09:00', '10:00');
    const conflito = DB.checkConflito(DATA, '09:00', '10:00');
    expect(conflito).not.toBeNull();
  });

  test('detecta sobreposição parcial no início', () => {
    criarAg('09:00', '10:00');
    // Novo agendamento começa antes e termina durante o existente
    expect(DB.checkConflito(DATA, '08:30', '09:30')).not.toBeNull();
  });

  test('detecta sobreposição parcial no fim', () => {
    criarAg('09:00', '10:00');
    // Novo agendamento começa durante e termina depois do existente
    expect(DB.checkConflito(DATA, '09:30', '10:30')).not.toBeNull();
  });

  test('detecta sobreposição quando novo contém o existente inteiro', () => {
    criarAg('09:00', '10:00');
    // Novo abrange todo o existente
    expect(DB.checkConflito(DATA, '08:00', '11:00')).not.toBeNull();
  });

  test('detecta sobreposição quando existente contém o novo inteiro', () => {
    criarAg('08:00', '11:00');
    // Novo está contido dentro do existente
    expect(DB.checkConflito(DATA, '09:00', '10:00')).not.toBeNull();
  });

  test('retorna o agendamento conflitante (para exibir na mensagem)', () => {
    const ag = criarAg('09:00', '10:00');
    const conflito = DB.checkConflito(DATA, '09:30', '10:30');
    expect(conflito.id).toBe(ag.id);
    expect(conflito.horaInicio).toBe('09:00');
    expect(conflito.horaFim).toBe('10:00');
  });

  test('permite múltiplos agendamentos sem sobreposição', () => {
    criarAg('08:00', '09:00');
    criarAg('09:00', '10:00');
    criarAg('10:00', '11:00');
    // Novo agendamento às 11:00 não deve conflitar
    expect(DB.checkConflito(DATA, '11:00', '12:00')).toBeNull();
  });

  test('agendado e confirmado geram conflito, realizado também', () => {
    criarAg('09:00', '10:00', 'confirmado');
    expect(DB.checkConflito(DATA, '09:00', '10:00')).not.toBeNull();
  });

  test('agendamento com status realizado ainda bloqueia a sala', () => {
    criarAg('09:00', '10:00', 'realizado');
    expect(DB.checkConflito(DATA, '09:30', '10:30')).not.toBeNull();
  });
});
