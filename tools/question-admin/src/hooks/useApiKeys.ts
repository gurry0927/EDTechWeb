import { useState, useCallback } from 'react';
import type { ApiKey, Provider } from '../types';
import { PROVIDER_MODELS } from '../types';

const STORAGE_KEY = 'qa-api-keys';
const ACTIVE_KEY = 'qa-active-key-id';

function load(): ApiKey[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function save(keys: ApiKey[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(load);
  const [activeId, setActiveId] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) ?? ''
  );

  const addKey = useCallback((label: string, value: string, provider: Provider, model: string) => {
    const id = crypto.randomUUID();
    const next = [...keys, { id, label, value, provider, model }];
    setKeys(next);
    save(next);
    if (!activeId) {
      setActiveId(id);
      localStorage.setItem(ACTIVE_KEY, id);
    }
  }, [keys, activeId]);

  const removeKey = useCallback((id: string) => {
    const next = keys.filter(k => k.id !== id);
    setKeys(next);
    save(next);
    if (activeId === id) {
      const fallback = next[0]?.id ?? '';
      setActiveId(fallback);
      localStorage.setItem(ACTIVE_KEY, fallback);
    }
  }, [keys, activeId]);

  const selectKey = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  // 從 activeId 開始輪替
  const orderedKeys = (() => {
    const idx = keys.findIndex(k => k.id === activeId);
    if (idx < 0) return keys;
    return [...keys.slice(idx), ...keys.slice(0, idx)];
  })();

  return { keys, activeId, orderedKeys, addKey, removeKey, selectKey };
}

export { PROVIDER_MODELS };
