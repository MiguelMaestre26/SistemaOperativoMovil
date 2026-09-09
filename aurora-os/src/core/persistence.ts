import { useEffect, useState } from 'react';

const PREFIX = 'auroraos:';

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function removeState(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function usePersistedState<T>(
  key: string,
  initial: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const init = typeof initial === 'function' ? (initial as () => T)() : initial;
    return loadState(key, init);
  });

  useEffect(() => {
    saveState(key, state);
  }, [key, state]);

  const setStateAndSave: (value: T | ((prev: T) => T)) => void = (value) => {
    setState(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      return next;
    });
  };

  return [state, setStateAndSave];
}