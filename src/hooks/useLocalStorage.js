import { useEffect, useState } from 'react';

// Same shape as useState, but persisted to localStorage under `key`.
// Reads the stored value once on mount; writes on every change.
// If localStorage is unavailable (private browsing, etc.) it just
// behaves like a normal useState instead of throwing.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write failures (storage full, private mode, etc.)
    }
  }, [key, value]);

  return [value, setValue];
}
