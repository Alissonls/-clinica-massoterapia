// ============================================================
// Jest Setup — Mock de localStorage para ambiente Node.js
// ============================================================

const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem:    (key)        => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    setItem:    (key, value) => { store[key] = String(value); },
    removeItem: (key)        => { delete store[key]; },
    clear:      ()           => { store = {}; },
    get length()             { return Object.keys(store).length; },
    key:        (i)          => Object.keys(store)[i] ?? null,
  };
};

Object.defineProperty(global, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true,
});

// Isolamento garantido: localStorage limpo antes de cada teste
beforeEach(() => localStorage.clear());
