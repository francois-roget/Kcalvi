import { useMemo } from 'react';

import { MEAL_TYPES, type DiaryEntry, type MealType } from '@/domain/types';

/**
 * Splits the day's entries into one list per meal, in memory.
 *
 * Deliberately derived from the single `observeByDate(today)` the screen already subscribes to,
 * rather than four `MealCard`-level subscriptions filtered in SQL (KCAL-185): four observed
 * queries would mean four re-render sources for one logical change, and the day's entry count
 * is small enough that filtering it in memory costs nothing. Same split-in-memory reasoning as
 * the library's quick filters (KCAL-104).
 *
 * Every meal gets an entry in the map, including empty ones -- the section renders all four
 * cards regardless (2a shows dinner empty).
 */
export function useEntriesByMeal(entries: DiaryEntry[]): Record<MealType, DiaryEntry[]> {
  return useMemo(() => {
    const byMeal = {} as Record<MealType, DiaryEntry[]>;
    for (const mealType of MEAL_TYPES) {
      byMeal[mealType] = [];
    }

    for (const entry of entries) {
      byMeal[entry.mealType].push(entry);
    }

    return byMeal;
  }, [entries]);
}
