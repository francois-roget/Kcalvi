import { useEffect, useState } from 'react';

// Light debounce (KCAL-103): avoids re-running the observed WatermelonDB query on every
// keystroke while still feeling instant.
export const SEARCH_DEBOUNCE_MS = 250;

/** Debounces a fast-changing value (e.g. search input) by `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
