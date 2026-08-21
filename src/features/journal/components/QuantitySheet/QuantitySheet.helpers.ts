import { useMemo, useState } from 'react';

import { calculateProportionalNutrition } from '@/domain/calculations';
import type { Food, NutritionValues } from '@/domain/types';

/**
 * What the sheet is adding to the journal. A discriminated union, mirroring
 * `AddEntryScreen`'s `EntryResult`: the recipe arm (KCAL-180) is entered in portions and never
 * goes through RM02, so the two cases stay structurally distinct rather than sharing an
 * ambiguous quantity field.
 */
export type QuantitySheetTarget = { kind: 'food'; food: Food };

/**
 * Owns the sheet's quantity state and derives the nutrition shown for it. The quantity starts
 * at the food's own reference quantity (100 for a "per 100 g" food, 1 for a by-unit one) --
 * the most common single serving and a sane starting point before quick portions
 * (KCAL-179) refine it.
 */
export function useQuantitySheet(target: QuantitySheetTarget) {
  const [quantity, setQuantity] = useState(target.food.referenceQuantity);

  // RM02 lives in domain/calculations; the sheet only displays what it returns
  // (interactions.md: "l'affichage ne recalcule rien lui-même").
  const nutrition = useMemo<NutritionValues>(
    () => calculateProportionalNutrition(target.food, quantity),
    [target.food, quantity],
  );

  return { quantity, setQuantity, nutrition };
}
