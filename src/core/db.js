/**
 * db.js — Camada de Dados (Firestore Multi-tenant com Cache Híbrido)
 * Mantém leitura `O(1)` e transforma gravações em `async` para o Firestore.
 * @module db
 */

import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config.js';

let _tenantId = null;

// Memória Cache (Sincronizada)
let _clientes = [];
let _terapeutas = [];
let _agendamentos = [];
let _fichas = [];

export const DB = {
  // ── Inicialização e Isolamento (Multi-tenant) ────────────────
  async initCache(tenantId) {
    _tenantId = tenantId;
    if (!tenantId) return;

    try {
      const qClientes     = query(collection(db, 'clientes'), where('tenantId', '==', tenantId));
      const qTerapeutas   = query(collection(db, 'terapeutas'), where('tenantId', '==', tenantId));
      const qAgendamentos = query(collection(db, 'agendamentos'), where('tenantId', '==', tenantId));
      const qFichas       = query(collection(db, 'fichas'), where('tenantId', '==', tenantId));

      const [snapCli, snapTer, snapAg, snapFi] = await Promise.all([
        getDocs(qClientes), getDocs(qTerapeutas), getDocs(qAgendamentos), getDocs(qFichas)
      ]);

      _clientes     = snapCli.docs.map(d => ({id: d.id, ...d.data()}));
      _terapeutas   = snapTer.docs.map(d => ({id: d.id, ...d.data()}));
      _agendamentos = snapAg.docs.map(d => ({id: d.id, ...d.data()}));
      _fichas       = snapFi.docs.map(d => ({id: d.id, ...d.data()}));
      
    } catch (e) {
      console.error('Erro ao baixar conta da clínica no Firebase:', e);
      throw e;
    }
  },

  clearCache() {
    _tenantId = null;
    _clientes = []; _terapeutas = []; _agendamentos = []; _fichas = [];
  },

  // ── Clientes ─────────────────────────────────────────────────
  getClientes()  { return _clientes; },
  getCliente(id) { return _clientes.find(c => c.id === id) || null; },
  async saveCliente(cliente) {
    if (!_tenantId) throw new Error("Acesso negado: SaaS não inicializado");
    cliente.tenantId = _tenantId; // Garantindo isolamento

    if (cliente.id) {
      const ref = doc(db, 'clientes', cliente.id);
      await updateDoc(ref, cliente);
      const idx = _clientes.findIndex(c => c.id === cliente.id);
      if (idx >= 0) _clientes[idx] = { ..._clientes[idx], ...cliente };
    } else {
      const ref = doc(collection(db, 'clientes'));
      cliente.id = ref.id;
      cliente.dataCadastro = new Date().toISOString();
      await setDoc(ref, cliente);
      _clientes.push(cliente);
    }
    return cliente;
  },
  async deleteCliente(id) {
    if (!_tenantId) return;
    await deleteDoc(doc(db, 'clientes', id));
    _clientes = _clientes.filter(c => c.id !== id);
  },

  // ── Terapeutas ───────────────────────────────────────────────
  getTerapeutas()   { return _terapeutas; },
  getTerapeuta(id)  { return _terapeutas.find(t => t.id === id) || null; },
  async saveTerapeuta(terapeuta) {
    if (!_tenantId) throw new Error("SaaS não inicializado");
    terapeuta.tenantId = _tenantId;

    if (terapeuta.id) {
      const ref = doc(db, 'terapeutas', terapeuta.id);
      await updateDoc(ref, terapeuta);
      const idx = _terapeutas.findIndex(t => t.id === terapeuta.id);
      if (idx >= 0) _terapeutas[idx] = { ..._terapeutas[idx], ...terapeuta };
    } else {
      const ref = doc(collection(db, 'terapeutas'));
      terapeuta.id = ref.id;
      terapeuta.dataCadastro = new Date().toISOString();
      await setDoc(ref, terapeuta);
      _terapeutas.push(terapeuta);
    }
    return terapeuta;
  },
  async deleteTerapeuta(id) {
    if (!_tenantId) return;
    await deleteDoc(doc(db, 'terapeutas', id));
    _terapeutas = _terapeutas.filter(t => t.id !== id);
  },

  // ── Agendamentos ─────────────────────────────────────────────
  getAgendamentos()    { return _agendamentos; },
  getAgendamento(id)   { return _agendamentos.find(a => a.id === id) || null; },
  async saveAgendamento(ag) {
    if (!_tenantId) throw new Error("SaaS não inicializado");
    ag.tenantId = _tenantId;

    if (ag.id) {
      const ref = doc(db, 'agendamentos', ag.id);
      await updateDoc(ref, ag);
      const idx = _agendamentos.findIndex(a => a.id === ag.id);
      if (idx >= 0) _agendamentos[idx] = { ..._agendamentos[idx], ...ag };
    } else {
      const ref = doc(collection(db, 'agendamentos'));
      ag.id = ref.id;
      ag.dataCriacao = new Date().toISOString();
      await setDoc(ref, ag);
      _agendamentos.push(ag);
    }
    return ag;
  },
  async deleteAgendamento(id) {
    if (!_tenantId) return;
    await deleteDoc(doc(db, 'agendamentos', id));
    _agendamentos = _agendamentos.filter(a => a.id !== id);
  },

  // ── Verificação de Conflitos Síncrona (na Memória) ───────────
  checkConflito(data, horaInicio, horaFim, excludeId = null) {
    const toMin = h => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
    const ini = toMin(horaInicio);
    const fim = toMin(horaFim);
    const candidatos = _agendamentos.filter(a =>
      a.data === data && a.id !== excludeId && a.status !== 'cancelado'
    );
    return candidatos.find(a => {
      const aIni = toMin(a.horaInicio);
      const aFim = toMin(a.horaFim);
      return ini < aFim && fim > aIni;
    }) || null;
  },

  // ── Fichas do Paciente ────────────────────────────────────────
  getFichas()             { return _fichas; },
  getFichasByCliente(cId) { return _fichas.filter(f => f.clienteId === cId); },
  async saveFicha(ficha) {
    if (!_tenantId) throw new Error("SaaS não inicializado");
    ficha.tenantId = _tenantId;

    if (ficha.id) {
      const ref = doc(db, 'fichas', ficha.id);
      await updateDoc(ref, ficha);
      const idx = _fichas.findIndex(f => f.id === ficha.id);
      if (idx >= 0) _fichas[idx] = { ..._fichas[idx], ...ficha };
    } else {
      const ref = doc(collection(db, 'fichas'));
      ficha.id = ref.id;
      ficha.dataCriacao = new Date().toISOString();
      await setDoc(ref, ficha);
      _fichas.push(ficha);
    }
    return ficha;
  },
};
