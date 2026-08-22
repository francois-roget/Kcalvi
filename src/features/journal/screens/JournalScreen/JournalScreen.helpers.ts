import { eachDayOfInterval } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { foodRepository, recipeRepository } from '@/data/repositories';
import { getWeekBoundaries } from '@/domain/calculations';
import type { DiaryEntry } from '@/domain/types';
import type { QuantitySheetTarget } from '@/features/journal/components/QuantitySheet';

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

/**
 * Resolves a journal entry back to the Food or Recipe the QuantitySheet needs to reopen on it
 * (F14 / KCAL-192).
 *
 * `null` while it loads, and also when the source record no longer exists -- an entry outlives
 * the food it was written from (RM16), so this lookup genuinely can miss, and the caller must
 * treat that as "can't edit" rather than assuming a record.
 */
export function useEntryTarget(entry: DiaryEntry | null): QuantitySheetTarget | null {
  const [target, setTarget] = useState<{ entryId: string; target: QuantitySheetTarget } | null>(
    null,
  );

  useEffect(() => {
    if (!entry) return;

    let cancelled = false;

    (async () => {
      if (entry.foodId) {
        const result = await foodRepository.findById(entry.foodId);
        if (!cancelled && result.ok) {
          setTarget({ entryId: entry.id, target: { kind: 'food', food: result.value } });
        }
        return;
      }
      if (entry.recipeId) {
        const result = await recipeRepository.findById(entry.recipeId);
        if (!cancelled && result.ok) {
          setTarget({ entryId: entry.id, target: { kind: 'recipe', recipe: result.value } });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entry]);

  if (!entry) return null;
  // Keyed on the entry id so a target resolved for a previously tapped entry never shows here.
  return target?.entryId === entry.id ? target.target : null;
}
