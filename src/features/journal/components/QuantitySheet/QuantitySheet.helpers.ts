import { useEffect, useMemo, useRef, useState } from 'react';

import { database } from '@/data/database';
import { foodRepository } from '@/data/repositories';
import { getRecipeWithIngredients } from '@/data/repositories/getRecipeWithIngredients';
import {
  calculatePortionNutrition,
  calculateProportionalNutrition,
  calculateRecipeTotals,
  convertPortionToReferenceQuantity,
  multiplyNutrition,
} from '@/domain/calculations';
import type { Food, FoodPortion, NutritionValues, Recipe } from '@/domain/types';
import { numberToText, toNumberOrUndefined } from '@/utils/format';

/**
 * What the sheet is adding to the journal. A discriminated union, mirroring
 * `AddEntryScreen`'s `EntryResult`: a recipe entry is counted in portions and never goes
 * through RM02, so the two cases stay structurally distinct rather than sharing an ambiguous
 * quantity field.
 */
export type QuantitySheetTarget = { kind: 'food'; food: Food } | { kind: 'recipe'; recipe: Recipe };

/**
 * The unit the entry is written with. `'portion'` is the single case where `DiaryEntry.quantity`
 * is NOT expressed in a food's reference unit (KCAL-180) -- every other entry is, which is what
 * lets RM02 stay unit-unaware.
 */
export const PORTION_UNIT = 'portion';

const ZERO_NUTRITION: NutritionValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** At most 3 quick portions fit the sheet's layout (2i). */
const MAX_QUICK_PORTIONS = 3;

/** Portions in display order, capped at what the sheet shows. */
export function visiblePortions(food: Food): FoodPortion[] {
  return [...food.portions].sort((a, b) => a.position - b.position).slice(0, MAX_QUICK_PORTIONS);
}

/**
 * Which quick portion starts selected (2i: "valeur médiane présélectionnée"). Expressed as a
 * true median index so it also behaves sensibly below 3 portions: 1 -> the only one,
 * 2 -> the first, 3 -> the middle.
 */
export function medianPortionIndex(count: number): number {
  return Math.floor((count - 1) / 2);
}

/**
 * Loads the food's quick portions.
 *
 * KCAL-179 -- the trap this exists for: `foodRepository.search()` deliberately returns
 * `portions: []` (KCAL-163b, to avoid a second N+1 on the library list), and the Food handed
 * to this sheet by AddEntryScreen comes straight from that search. Without this explicit
 * `findById`, the sheet would render with no quick-portion buttons at all -- silently, with no
 * error and no failing test, since an empty portions array is a perfectly valid Food.
 */
function useFoodWithPortions(initialFood: Food | null): Food | null {
  const [loaded, setLoaded] = useState<Food | null>(null);

  useEffect(() => {
    if (!initialFood) return;

    let cancelled = false;
    foodRepository.findById(initialFood.id).then((result) => {
      if (!cancelled && result.ok) setLoaded(result.value);
    });

    return () => {
      cancelled = true;
    };
  }, [initialFood]);

  if (!initialFood) return null;
  // Derived rather than reset inside the effect: the id check is what keeps a record loaded
  // for a previously opened food from leaking into this one, without a setState-in-effect.
  return loaded?.id === initialFood.id ? loaded : initialFood;
}

/**
 * Per-portion nutrition for a recipe (F09), from its real ingredient rows: RM03's
 * `calculateRecipeTotals` then `calculatePortionNutrition`, both unchanged from Sprint 2.
 *
 * `undefined` until it resolves -- the sheet shows zeroes meanwhile rather than a wrong
 * number, and KCAL-181 refuses to write an entry whose per-portion value never loaded.
 */
function useRecipePortionNutrition(recipe: Recipe | null): NutritionValues | undefined {
  const [perPortion, setPerPortion] = useState<{ id: string; values: NutritionValues } | null>(
    null,
  );

  useEffect(() => {
    if (!recipe) return;

    let cancelled = false;
    getRecipeWithIngredients(database, recipe.id).then((result) => {
      if (cancelled || !result.ok) return;
      const totals = calculateRecipeTotals(result.value.recipe, result.value.items);
      setPerPortion({
        id: recipe.id,
        values: calculatePortionNutrition(totals, result.value.recipe.servings),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [recipe]);

  if (!recipe) return undefined;
  return perPortion?.id === recipe.id ? perPortion.values : undefined;
}

/**
 * Owns the sheet's quantity state and derives the nutrition shown for it.
 *
 * Quantity is held as text, not a number: the decimal-pad keyboard types a comma in fr-BE, so
 * the raw input round-trips through `numberToText`/`toNumberOrUndefined` (`Number('82,5')` is
 * NaN). While the field is empty or mid-edit ("82," or "abc") the display falls back to zeroes
 * rather than rendering "NaN kcal" -- rejecting the input is submit-time validation's job
 * (RM14, KCAL-181), not the live readout's.
 *
 * The quantity always stays in the food's reference unit, including when a quick portion is
 * tapped: `convertPortionToReferenceQuantity` runs at selection time, never at calculation
 * time, because `calculateProportionalNutrition` has no unit awareness at all (the invariant
 * documented on that function since Sprint 2).
 */
export function useQuantitySheet(target: QuantitySheetTarget) {
  // Both branch hooks run unconditionally with a null argument on the arm that isn't active --
  // a hook can't be called behind an `if`.
  const food = useFoodWithPortions(target.kind === 'food' ? target.food : null);
  const perPortion = useRecipePortionNutrition(target.kind === 'recipe' ? target.recipe : null);

  const portions = useMemo(() => (food ? visiblePortions(food) : []), [food]);

  // A recipe entry starts at one portion; a food entry at its own reference quantity.
  const [quantityText, setQuantityText] = useState(
    numberToText(target.kind === 'food' ? target.food.referenceQuantity : 1),
  );
  const [selectedPortionId, setSelectedPortionId] = useState<string | undefined>(undefined);

  // The portions arrive after the first render (see useFoodWithPortions), so the median
  // preselect has to happen once they do. Guarded by a ref rather than a plain effect so it
  // never overwrites a quantity the user has already typed in the meantime, and so it doesn't
  // re-fire if the same food's record is refreshed.
  const preselectApplied = useRef(false);

  useEffect(() => {
    preselectApplied.current = false;
  }, [target]);

  useEffect(() => {
    if (preselectApplied.current || portions.length === 0) return;
    preselectApplied.current = true;

    const portion = portions[medianPortionIndex(portions.length)];
    setSelectedPortionId(portion.id);
    setQuantityText(numberToText(convertPortionToReferenceQuantity(portion, 1)));
  }, [portions]);

  function selectPortion(portion: FoodPortion) {
    setSelectedPortionId(portion.id);
    setQuantityText(numberToText(convertPortionToReferenceQuantity(portion, 1)));
  }

  function editQuantity(text: string) {
    // Typing a raw quantity detaches the entry from any portion: `portionId` records how the
    // entry was entered (KCAL-163d), so it must not survive a hand-typed amount.
    setSelectedPortionId(undefined);
    setQuantityText(text);
  }

  const parsedQuantity = toNumberOrUndefined(quantityText);
  const quantity =
    parsedQuantity === undefined || Number.isNaN(parsedQuantity) ? undefined : parsedQuantity;

  /**
   * The two arms use different domain functions, and that difference is the point:
   * - a food scales its per-reference-unit values by the quantity (RM02);
   * - a recipe multiplies its already-per-portion values by a portion count (KCAL-171),
   *   which is why it never touches RM02.
   *
   * Either way the sheet only displays what domain/calculations returns and computes nothing
   * itself (interactions.md). Recomputed on every keystroke, which is cheap -- four
   * multiplications on already-loaded data.
   */
  const nutrition = useMemo<NutritionValues>(() => {
    if (quantity === undefined) return ZERO_NUTRITION;
    if (food) return calculateProportionalNutrition(food, quantity);
    if (perPortion) return multiplyNutrition(perPortion, quantity);
    return ZERO_NUTRITION;
  }, [food, perPortion, quantity]);

  return {
    food,
    perPortion,
    portions,
    selectedPortionId,
    selectPortion,
    quantityText,
    editQuantity,
    quantity,
    nutrition,
  };
}
