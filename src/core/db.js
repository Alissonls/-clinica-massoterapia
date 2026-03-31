/**
 * db.js — Camada de Dados (LocalStorage)
 * Gerencia todas as operações CRUD do sistema SAP.
 * @module db
 */

const KEYS = Object.freeze({
  CLIENTES:     'sap_clientes',
  TERAPEUTAS:   'sap_terapeutas',
  AGENDAMENTOS: 'sap_agendamentos',
  FICHAS:       'sap_fichas',
});

export const DB = {
  // ── Helpers ──────────────────────────────────────────────────
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  _id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  // ── Clientes ─────────────────────────────────────────────────
  getClientes()  { return this._get(KEYS.CLIENTES); },
  getCliente(id) { return this.getClientes().find(c => c.id === id) || null; },
  saveCliente(cliente) {
    const lista = this.getClientes();
    if (cliente.id) {
      const idx = lista.findIndex(c => c.id === cliente.id);
      idx >= 0 ? (lista[idx] = { ...lista[idx], ...cliente }) : lista.push(cliente);
    } else {
      cliente.id = this._id();
      cliente.dataCadastro = new Date().toISOString();
      lista.push(cliente);
    }
    this._set(KEYS.CLIENTES, lista);
    return cliente;
  },
  deleteCliente(id) {
    this._set(KEYS.CLIENTES, this.getClientes().filter(c => c.id !== id));
  },

  // ── Terapeutas ───────────────────────────────────────────────
  getTerapeutas()   { return this._get(KEYS.TERAPEUTAS); },
  getTerapeuta(id)  { return this.getTerapeutas().find(t => t.id === id) || null; },
  saveTerapeuta(terapeuta) {
    const lista = this.getTerapeutas();
    if (terapeuta.id) {
      const idx = lista.findIndex(t => t.id === terapeuta.id);
      idx >= 0 ? (lista[idx] = { ...lista[idx], ...terapeuta }) : lista.push(terapeuta);
    } else {
      terapeuta.id = this._id();
      terapeuta.dataCadastro = new Date().toISOString();
      lista.push(terapeuta);
    }
    this._set(KEYS.TERAPEUTAS, lista);
    return terapeuta;
  },
  deleteTerapeuta(id) {
    this._set(KEYS.TERAPEUTAS, this.getTerapeutas().filter(t => t.id !== id));
  },

  // ── Agendamentos ─────────────────────────────────────────────
  getAgendamentos()    { return this._get(KEYS.AGENDAMENTOS); },
  getAgendamento(id)   { return this.getAgendamentos().find(a => a.id === id) || null; },
  saveAgendamento(ag) {
    const lista = this.getAgendamentos();
    if (ag.id) {
      const idx = lista.findIndex(a => a.id === ag.id);
      idx >= 0 ? (lista[idx] = { ...lista[idx], ...ag }) : lista.push(ag);
    } else {
      ag.id = this._id();
      ag.dataCriacao = new Date().toISOString();
      lista.push(ag);
    }
    this._set(KEYS.AGENDAMENTOS, lista);
    return ag;
  },
  deleteAgendamento(id) {
    this._set(KEYS.AGENDAMENTOS, this.getAgendamentos().filter(a => a.id !== id));
  },

  /**
   * Verifica conflito de horário na sala única.
   * @param {string} data
   * @param {string} horaInicio - "HH:MM"
   * @param {string} horaFim    - "HH:MM"
   * @param {string|null} excludeId
   * @returns {Object|null}
   */
  checkConflito(data, horaInicio, horaFim, excludeId = null) {
    const toMin = h => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
    const ini = toMin(horaInicio);
    const fim = toMin(horaFim);
    const candidatos = this.getAgendamentos().filter(a =>
      a.data === data && a.id !== excludeId && a.status !== 'cancelado'
    );
    return candidatos.find(a => {
      const aIni = toMin(a.horaInicio);
      const aFim = toMin(a.horaFim);
      return ini < aFim && fim > aIni;
    }) || null;
  },

  // ── Fichas do Paciente ────────────────────────────────────────
  getFichas()             { return this._get(KEYS.FICHAS); },
  getFichasByCliente(cId) { return this.getFichas().filter(f => f.clienteId === cId); },
  saveFicha(ficha) {
    const lista = this.getFichas();
    if (ficha.id) {
      const idx = lista.findIndex(f => f.id === ficha.id);
      idx >= 0 ? (lista[idx] = { ...lista[idx], ...ficha }) : lista.push(ficha);
    } else {
      ficha.id = this._id();
      ficha.dataCriacao = new Date().toISOString();
      lista.push(ficha);
    }
    this._set(KEYS.FICHAS, lista);
    return ficha;
  },

  // ── Seed de demonstração ──────────────────────────────────────
  seedDemo() {
    if (this.getTerapeutas().length > 0) return;
    [
      { nome: 'Ana Beatriz',   especialidade: 'Massagem Relaxante, Pedras Quentes', cor: '#6ee7b7', emoji: '🌿' },
      { nome: 'Carlos Lima',   especialidade: 'Drenagem Linfática, Shiatsu',        cor: '#93c5fd', emoji: '💧' },
      { nome: 'Fernanda Dias', especialidade: 'Reflexologia, Aromaterapia',          cor: '#f9a8d4', emoji: '🌸' },
    ].forEach(t => this.saveTerapeuta(t));

    const tIds = this.getTerapeutas().map(t => t.id);
    [
      { nome: 'Maria Silva',  telefone: '(11) 91234-5678', email: 'maria@email.com', aceiteLgpd: true, dataAceiteLgpd: new Date().toISOString() },
      { nome: 'João Pereira', telefone: '(11) 98765-4321', email: 'joao@email.com',  aceiteLgpd: true, dataAceiteLgpd: new Date().toISOString() },
    ].forEach(c => this.saveCliente(c));

    const cIds = this.getClientes().map(c => c.id);
    const hoje   = new Date().toISOString().slice(0, 10);
    const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    [
      { clienteId: cIds[0], terapeutaId: tIds[0], data: hoje,   horaInicio: '09:00', horaFim: '10:00', servico: 'Massagem Relaxante', status: 'confirmado', observacoes: '' },
      { clienteId: cIds[1], terapeutaId: tIds[1], data: hoje,   horaInicio: '10:00', horaFim: '11:00', servico: 'Drenagem Linfática', status: 'agendado',   observacoes: '' },
      { clienteId: cIds[0], terapeutaId: tIds[2], data: amanha, horaInicio: '14:00', horaFim: '15:00', servico: 'Reflexologia',        status: 'agendado',   observacoes: '' },
    ].forEach(a => this.saveAgendamento(a));
  },
};
