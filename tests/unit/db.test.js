// ============================================================
// db.test.js — Testes unitários da camada de dados
// ============================================================
import { DB } from '../../src/core/db.js';

// ── Clientes ─────────────────────────────────────────────────
describe('DB — Clientes', () => {
  test('saveCliente cria cliente com id e dataCadastro', () => {
    const c = DB.saveCliente({ nome: 'Ana Silva', aceiteLgpd: true });
    expect(c.id).toBeDefined();
    expect(c.dataCadastro).toBeDefined();
    expect(c.nome).toBe('Ana Silva');
  });

  test('getClientes retorna lista correta', () => {
    DB.saveCliente({ nome: 'João' });
    DB.saveCliente({ nome: 'Maria' });
    expect(DB.getClientes().length).toBe(2);
  });

  test('getCliente retorna cliente correto por id', () => {
    const c = DB.saveCliente({ nome: 'Pedro' });
    const found = DB.getCliente(c.id);
    expect(found.nome).toBe('Pedro');
  });

  test('getCliente retorna null para id inexistente', () => {
    expect(DB.getCliente('nao-existe')).toBeNull();
  });

  test('saveCliente com id atualiza cliente existente', () => {
    const c = DB.saveCliente({ nome: 'Lúcia' });
    DB.saveCliente({ id: c.id, nome: 'Lúcia Atualizada' });
    expect(DB.getCliente(c.id).nome).toBe('Lúcia Atualizada');
    expect(DB.getClientes().length).toBe(1);
  });

  test('deleteCliente remove corretamente', () => {
    const c = DB.saveCliente({ nome: 'Deletar' });
    expect(DB.getClientes().length).toBe(1);
    DB.deleteCliente(c.id);
    expect(DB.getClientes().length).toBe(0);
    expect(DB.getCliente(c.id)).toBeNull();
  });
});

// ── Terapeutas ────────────────────────────────────────────────
describe('DB — Terapeutas', () => {
  test('saveTerapeuta cria com id', () => {
    const t = DB.saveTerapeuta({ nome: 'Beatriz', especialidade: 'Shiatsu' });
    expect(t.id).toBeDefined();
    expect(t.nome).toBe('Beatriz');
  });

  test('getTerapeuta retorna null para id inexistente', () => {
    expect(DB.getTerapeuta('xyz')).toBeNull();
  });

  test('deleteTerapeuta remove corretamente', () => {
    const t = DB.saveTerapeuta({ nome: 'Remove-me' });
    DB.deleteTerapeuta(t.id);
    expect(DB.getTerapeuta(t.id)).toBeNull();
  });
});

// ── Agendamentos ──────────────────────────────────────────────
describe('DB — Agendamentos', () => {
  test('saveAgendamento cria com id e dataCriacao', () => {
    const ag = DB.saveAgendamento({
      clienteId: 'c1', terapeutaId: 't1',
      data: '2026-04-01', horaInicio: '09:00', horaFim: '10:00', status: 'agendado',
    });
    expect(ag.id).toBeDefined();
    expect(ag.dataCriacao).toBeDefined();
  });

  test('getAgendamento retorna null para id inexistente', () => {
    expect(DB.getAgendamento('nope')).toBeNull();
  });

  test('deleteAgendamento remove corretamente', () => {
    const ag = DB.saveAgendamento({ clienteId: 'c1', terapeutaId: 't1', data: '2026-04-01', horaInicio: '08:00', horaFim: '09:00', status: 'agendado' });
    DB.deleteAgendamento(ag.id);
    expect(DB.getAgendamento(ag.id)).toBeNull();
  });
});

// ── Fichas ────────────────────────────────────────────────────
describe('DB — Fichas', () => {
  test('saveFicha cria com id e dataCriacao', () => {
    const f = DB.saveFicha({ clienteId: 'c1', conteudo: 'Sessão de relaxamento' });
    expect(f.id).toBeDefined();
    expect(f.dataCriacao).toBeDefined();
  });

  test('getFichasByCliente filtra corretamente', () => {
    DB.saveFicha({ clienteId: 'cliente-A', conteudo: 'Ficha 1' });
    DB.saveFicha({ clienteId: 'cliente-B', conteudo: 'Ficha 2' });
    DB.saveFicha({ clienteId: 'cliente-A', conteudo: 'Ficha 3' });
    expect(DB.getFichasByCliente('cliente-A').length).toBe(2);
    expect(DB.getFichasByCliente('cliente-B').length).toBe(1);
    expect(DB.getFichasByCliente('cliente-X').length).toBe(0);
  });
});

// ── Seed Demo ─────────────────────────────────────────────────
describe('DB — Seed Demo', () => {
  test('seedDemo cria terapeutas, clientes e agendamentos', () => {
    DB.seedDemo();
    expect(DB.getTerapeutas().length).toBeGreaterThan(0);
    expect(DB.getClientes().length).toBeGreaterThan(0);
    expect(DB.getAgendamentos().length).toBeGreaterThan(0);
  });

  test('seedDemo não duplica se já houver terapeutas', () => {
    DB.seedDemo();
    const countBefore = DB.getTerapeutas().length;
    DB.seedDemo(); // segunda chamada
    expect(DB.getTerapeutas().length).toBe(countBefore);
  });
});
