import type { Observable } from '@nozbe/watermelondb/utils/rx';
import { useEffect, useState } from 'react';

/**
 * Bridges WatermelonDB observed queries (`repository.search(...)`) and React:
 * re-renders on every emission, with no manual cache invalidation
 * (TECHNICAL_SPECS.MD §5.3).
 */
export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
