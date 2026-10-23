import assert from 'node:assert/strict';
import { test } from 'node:test';

test('restoring saved inputs preserves data and supplies both new input slots', async () => {
  const entries = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
    clear: () => entries.clear(),
    key: (index) => Array.from(entries.keys())[index] ?? null,
    get length() { return entries.size; },
  };
  Object.defineProperty(globalThis, 'window', { value: { localStorage }, configurable: true });
  for (const version of [1, 2]) {
    const saved = {
      'user.cfg': 'user:admin@pve:1:0::::Admin::',
      ...(version === 2 ? { 'tfa.json': '[]' } : {}),
    };
    const { useAuditStore } = await import('../src/store/auditStore');
    localStorage.setItem('proxguard-storage', JSON.stringify({
      version,
      state: { history: [], comparisonPair: null, lastConfigInputs: saved },
    }));
    await useAuditStore.persist.rehydrate();
    useAuditStore.getState().loadLastConfig();
    const restored = useAuditStore.getState().configInputs;
    assert.equal(restored['user.cfg'], saved['user.cfg']);
    assert.equal(restored['tfa.json'], version === 2 ? '[]' : '');
    assert.equal(restored.pveproxy, '');
  }
});
