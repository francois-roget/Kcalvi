import { eachDayOfInterval } from 'date-fns';
import { useMemo } from 'react';

import { getWeekBoundaries } from '@/domain/calculations';

/**
 * The seven days of `reference`'s week, Monday → Sunday, from RM12's `getWeekBoundaries` rather
 * than a locally reimplemented week start (KCAL-187).
 */
export function useWeekDays(reference: Date): Date[] {
  return useMemo(() => {
    const { start, end } = getWeekBoundaries(reference);
    return eachDayOfInterval({ start, end });
  }, [reference]);
}
