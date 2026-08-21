import { useMemo, useState } from 'react';

import { calculateProportionalNutrition } from '@/domain/calculations';
import type { Food, NutritionValues } from '@/domain/types';
import { numberToText, toNumberOrUndefined } from '@/utils/format';

/**
 * What the sheet is adding to the journal. A discriminated union, mirroring
 * `AddEntryScreen`'s `EntryResult`: the recipe arm (KCAL-180) is entered in portions and never
 * goes through RM02, so the two cases stay structurally distinct rather than sharing an
 * ambiguous quantity field.
 */
export type QuantitySheetTarget = { kind: 'food'; food: Food };

const ZERO_NUTRITION: NutritionValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * Owns the sheet's quantity state and derives the nutrition shown for it. The quantity starts
 * at the food's own reference quantity (100 for a "per 100 g" food, 1 for a by-unit one) --
 * the most common single serving and a sane starting point before quick portions
 * (KCAL-179) refine it.
 *
 * Quantity is held as text, not a number: the decimal-pad keyboard types a comma in fr-BE, so
 * the raw input round-trips through `numberToText`/`toNumberOrUndefined` (`Number('82,5')` is
 * NaN). While the field is empty or mid-edit ("82," or "abc") the display falls back to zeroes
 * rather than rendering "NaN kcal" -- rejecting the input is submit-time validation's job
 * (RM14, KCAL-181), not the live readout's.
 */
export function useQuantitySheet(target: QuantitySheetTarget) {
  const [quantityText, setQuantityText] = useState(numberToText(target.food.referenceQuantity));

  const parsedQuantity = toNumberOrUndefined(quantityText);
  const quantity =
    parsedQuantity === undefined || Number.isNaN(parsedQuantity) ? undefined : parsedQuantity;

  // RM02 lives in domain/calculations; the sheet only displays what it returns
  // (interactions.md: "l'affichage ne recalcule rien lui-même"). Recomputed on every
  // keystroke, which is cheap -- four multiplications on already-loaded data.
  const nutrition = useMemo<NutritionValues>(
    () =>
      quantity === undefined
        ? ZERO_NUTRITION
        : calculateProportionalNutrition(target.food, quantity),
    [target.food, quantity],
  );

  return { quantityText, setQuantityText, quantity, nutrition };
}
