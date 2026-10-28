const STORAGE_KEY = 'simple-calculator-mobile-history';
const DEFAULT_LIMIT = 50;

export function createHistoryStore(storage = null, limit = DEFAULT_LIMIT) {
  const maxEntries = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
  let entries = loadEntries();

  function resolveStorage() {
    return storage ?? globalThis.localStorage;
  }

  function loadEntries() {
    try {
      const saved = JSON.parse(resolveStorage()?.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((entry) => entry && typeof entry.expression === 'string' && typeof entry.result === 'string')
        .slice(0, maxEntries);
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      resolveStorage()?.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Keep the store usable in memory if browser storage is unavailable.
    }
  }

  return {
    getAll() {
      return entries.map((entry) => ({ ...entry }));
    },
    add(entry) {
      if (!entry || typeof entry.expression !== 'string' || typeof entry.result !== 'string') return;
      entries = [{ expression: entry.expression, result: entry.result }, ...entries].slice(0, maxEntries);
      persist();
    },
    remove(index) {
      if (!Number.isInteger(index) || index < 0 || index >= entries.length) return;
      entries = entries.filter((_, currentIndex) => currentIndex !== index);
      persist();
    },
    clear() {
      entries = [];
      persist();
    }
  };
}
