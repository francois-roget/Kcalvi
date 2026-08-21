import { useMemo } from 'react';

import { MEAL_TYPES, type DiaryEntry, type MealType } from '@/domain/types';

/**
 * Splits the day's entries into one list per meal.
 *
 * Deliberately derived from the single `observeByDate(today)` the screen already subscribes to,
 * rather than four `MealCard`-level subscriptions filtered in SQL (KCAL-185): four observed
 * queries would mean four re-render sources for one logical change, and the day's entry count
 * is small enough that grouping it in memory costs nothing. Same split-in-memory reasoning as
 * the library's quick filters (KCAL-104).
 *
 * Every meal gets a list, including empty ones -- the section renders all four cards
 * regardless (2a shows dinner empty, 2s shows all four empty), and a missing key would hand
 * `MealCard` an `undefined` to read `.length` off.
 */
export function groupEntriesByMeal(entries: DiaryEntry[]): Record<MealType, DiaryEntry[]> {
  const byMeal = {} as Record<MealType, DiaryEntry[]>;
  for (const mealType of MEAL_TYPES) {
    byMeal[mealType] = [];
  }

  for (const entry of entries) {
    byMeal[entry.mealType].push(entry);
  }

  return byMeal;
}

/** `groupEntriesByMeal`, memoized on the observed entry list. */
export function useEntriesByMeal(entries: DiaryEntry[]): Record<MealType, DiaryEntry[]> {
  return useMemo(() => groupEntriesByMeal(entries), [entries]);
}
