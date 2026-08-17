import type { Observable } from '@nozbe/watermelondb/utils/rx';
import { useEffect, useState } from 'react';

/**
 * Pont entre les requêtes observées WatermelonDB (`repository.search(...)`)
 * et React : re-render à chaque émission, sans invalidation manuelle de
 * cache (TECHNICAL_SPECS.MD §5.3).
 */
export function useObservable<T>(observable: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
