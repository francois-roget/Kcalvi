import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { database } from '@/data/database';
import { foodRepository, recipeRepository } from '@/data/repositories';
import type { CreateRecipeInput } from '@/data/repositories/RecipeRepository';
import { getRecipeWithIngredients } from '@/data/repositories/getRecipeWithIngredients';
import {
  calculatePortionNutrition,
  calculateRecipeTotals,
  convertPortionToReferenceQuantity,
} from '@/domain/calculations';
import type { DomainError, Food, FoodPortion, RecipeIngredient } from '@/domain/types';
import { assertNonNegative } from '@/domain/validation';
import { useObservable } from '@/hooks/useObservable';
import type { RecipeFormScreenProps } from '@/navigation/types';
import { formatInteger, parseLocaleNumber, unitLabel } from '@/utils/format';

// Light debounce for the ingredient picker's food search (mirrors LibraryScreen's KCAL-103 pattern).
const SEARCH_DEBOUNCE_MS = 250;

const EMPTY_FOODS: Food[] = [];

export type QuantityMode = 'reference' | 'servings';
export type PickerStep = 'search' | 'quantity';

/**
 * Local draft shape for an ingredient row while the form is open.
 *
 * `referenceQuantity` is always expressed in `food.referenceUnit` terms -- it's exactly
 * what gets sent as `RecipeIngredient.quantity` on submit (see convertPortionToReferenceQuantity's
 * doc comment: `calculateProportionalNutrition` has no unit awareness, so the conversion from
 * "portions" must happen before the write, not at calculation time).
 *
 * `displayQuantity`/`displayUnit` are what the user actually typed/picked (e.g. "2" + a
 * portion's label for "2 pots"), kept separately so the ingredient list can show a
 * human-readable amount instead of the (potentially large) reference-unit-converted number.
 *
 * `portionId` (KCAL-163d) is set when the ingredient was entered via a food_portions row --
 * `undefined` when entered directly in the reference unit.
 */
export type IngredientDraft = {
  tempId: string;
  food: Food;
  referenceQuantity: number;
  displayQuantity: number;
  displayUnit: string;
  portionId?: string;
};

export type RecipeFormValues = {
  name: string;
  servings: string;
  isFavorite: boolean;
};

const DEFAULT_VALUES: RecipeFormValues = {
  name: '',
  servings: '1',
  isFavorite: false,
};

/** Converts a domain number to the comma-decimal text NumberField/parseLocaleNumber expect. */
export function numberToText(value: number): string {
  return String(value).replace('.', ',');
}

export function toNumberOrUndefined(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return parseLocaleNumber(trimmed);
}

/**
 * Resolves what to display for an ingredient loaded from storage (edit mode), using the
 * explicit `portionId` traceability column (KCAL-163d) instead of the old unit-comparison
 * heuristic (removed -- it became ambiguous the moment a food could have more than one
 * portion sharing a unit). If `portionId` is set but no longer resolves to a portion on the
 * food (it was deleted since), fall back to the reference-unit display -- the ingredient's
 * stored `quantity` is always valid and calculable regardless of whether its portion label
 * can still be resolved, so this must never throw or surface as an error.
 */
export function resolveIngredientDisplay(
  food: Food,
  ingredient: RecipeIngredient,
): { displayQuantity: number; displayUnit: string; portionId?: string } {
  const portion = ingredient.portionId
    ? food.portions.find((candidate) => candidate.id === ingredient.portionId)
    : undefined;

  if (portion && portion.quantity > 0) {
    return {
      displayQuantity: ingredient.quantity / portion.quantity,
      displayUnit: portion.label,
      portionId: portion.id,
    };
  }
  return { displayQuantity: ingredient.quantity, displayUnit: food.referenceUnit };
}

/**
 * A single quick-portion shortcut shown as a `QuickPortionButton` on the quantity step
 * (KCAL-164). Tapping one fills `quantityText` (and switches `quantityMode`) but never
 * submits by itself -- the user still confirms/adjusts, unlike the diary-entry
 * median-preselect pattern (screen 2i, Sprint 3), which auto-fills without a tap.
 */
export type QuickPortionPill = {
  key: string;
  label: string;
  quantityText: string;
  mode: QuantityMode;
  portion?: FoodPortion;
};

/**
 * Builds up to 3 quick-portion pills for the food currently selected in the picker
 * (KCAL-164). Priority order:
 * 1. The food has real saved portions (KCAL-163a) -- one pill per portion, ascending
 *    `position`, capped at 3. Each represents "1" of that portion (e.g. "1 pot").
 * 2. No portions, but the food is counted "by unit" -- 1 / 2 / 3 units, entered directly
 *    in the reference unit (scaling a unit count by a ratio makes no sense).
 * 3. No portions, reference unit is g/ml -- 0.5x / 1x / 1.5x the food's actual
 *    `referenceQuantity` (e.g. 50/100/150 g for a "per 100 g" food, 25/50/75 g for a
 *    "per 50 g" food -- always proportional, never hardcoded to literally 100).
 */
export function buildQuickPortionPills(
  food: Food,
  t: (key: string, options?: Record<string, unknown>) => string,
): QuickPortionPill[] {
  if (food.portions.length > 0) {
    return [...food.portions]
      .sort((a, b) => a.position - b.position)
      .slice(0, 3)
      .map((portion) => ({
        key: portion.id,
        label: portion.label,
        quantityText: numberToText(1),
        mode: 'servings' as const,
        portion,
      }));
  }

  if (food.referenceUnit === 'unit') {
    return [1, 2, 3].map((count) => ({
      key: `unit-${count}`,
      label: t('recipeForm.picker.unitPill', { count }),
      quantityText: numberToText(count),
      mode: 'reference' as const,
    }));
  }

  return [0.5, 1, 1.5].map((multiplier) => {
    const quantity = food.referenceQuantity * multiplier;
    return {
      key: `ratio-${multiplier}`,
      label: t('recipeForm.picker.referencePill', {
        value: formatInteger(quantity),
        unit: unitLabel(t, food.referenceUnit),
      }),
      quantityText: numberToText(quantity),
      mode: 'reference' as const,
    };
  });
}

/** Debounces a fast-changing value (e.g. the ingredient picker's search input). */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

function formatSubmitError(
  error: DomainError,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (error.code === 'NEGATIVE_VALUE') {
    return t('recipeForm.errors.negativeValue');
  }
  if (error.code === 'RECIPE_NOT_FOUND') {
    return t('recipeForm.errors.notFound');
  }
  return t('recipeForm.errors.generic');
}

/**
 * All the state/derived-data/handlers behind the create/edit recipe form: react-hook-form
 * binding, the ingredient list (add/remove), the two-step ingredient picker (search food ->
 * enter quantity, KCAL-133), live nutrition totals, and submit.
 *
 * This is a mechanical extraction of what used to be RecipeFormScreen's component body --
 * every handler keeps closing over the exact same state it did before the move (in
 * particular the KCAL-164 quick-portion-pill / `activePortion` / `portionId` chain, see
 * `confirmAddIngredient` below).
 */
export function useRecipeForm(
  recipeId: string | undefined,
  isEditMode: boolean,
  navigation: RecipeFormScreenProps['navigation'],
) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | undefined>(undefined);

  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const nextTempId = useRef(0);

  // KCAL-133 — "+ Ajouter un ingrédient" picker: a two-step BottomSheet (search a food, then
  // enter a quantity for it).
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerStep, setPickerStep] = useState<PickerStep>('search');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('reference');
  const [quantityText, setQuantityText] = useState('');
  const [quantityError, setQuantityError] = useState<string | undefined>(undefined);
  // KCAL-164 — which food_portions row a "servings" quantity is expressed in. Set explicitly
  // when a portion pill is tapped; falls back to the food's first portion (the pre-KCAL-164
  // behavior) when the "En portions usuelles" chip is used directly without a pill tap.
  const [activePortion, setActivePortion] = useState<FoodPortion | undefined>(undefined);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipeFormValues>({ defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (!isEditMode || !recipeId) return;
    let cancelled = false;

    (async () => {
      const result = await getRecipeWithIngredients(database, recipeId);
      if (cancelled) return;
      setLoading(false);

      if (!result.ok) {
        setLoadError(true);
        return;
      }

      const { recipe, items } = result.value;
      // KCAL-161: preload isFavorite too -- LocalRecipeRepository.update only overwrites a
      // field when it's !== undefined, so once onValid starts sending isFavorite it becomes
      // authoritative. Skipping this preload would silently un-favorite the recipe on save.
      reset({
        name: recipe.name,
        servings: numberToText(recipe.servings),
        isFavorite: recipe.isFavorite,
      });
      setIngredients(
        items.map(({ ingredient, food }) => {
          const { displayQuantity, displayUnit, portionId } = resolveIngredientDisplay(
            food,
            ingredient,
          );
          return {
            tempId: ingredient.id,
            food,
            referenceQuantity: ingredient.quantity,
            displayQuantity,
            displayUnit,
            portionId,
          };
        }),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, recipeId, reset]);

  const debouncedQuery = useDebouncedValue(ingredientQuery, SEARCH_DEBOUNCE_MS);
  const foodSearchObservable = useMemo(
    () => foodRepository.search(debouncedQuery),
    [debouncedQuery],
  );
  const foodResults = useObservable(foodSearchObservable, EMPTY_FOODS);

  const watchedValues = useWatch({ control }) as RecipeFormValues;

  // KCAL-131 — "Poids total" is not a persisted Recipe field: it's the live sum of every
  // ingredient's reference-unit-equivalent quantity (the same number stored as
  // RecipeIngredient.quantity), shown read-only. Summing across ingredients only means
  // something physically when every ingredient shares the same reference unit (a recipe
  // mixing e.g. grams and "unité" foods -- très courant, ex. "2 œufs" + "150 g de poulet" --
  // has no coherent total, so that case shows a dash instead of a misleading number).
  const totalWeight = useMemo(
    () => ingredients.reduce((sum, draft) => sum + draft.referenceQuantity, 0),
    [ingredients],
  );

  const totalWeightUnit = useMemo(() => {
    if (ingredients.length === 0) return 'g';
    const [first, ...rest] = ingredients;
    const sameUnit = rest.every((draft) => draft.food.referenceUnit === first.food.referenceUnit);
    return sameUnit ? first.food.referenceUnit : null;
  }, [ingredients]);

  // KCAL-134 — recomputed live via calculateRecipeTotals -> calculatePortionNutrition whenever
  // ingredients or the servings field change.
  const totalsIngredients = useMemo(
    () =>
      ingredients.map((draft) => ({
        ingredient: {
          id: draft.tempId,
          recipeId: recipeId ?? 'draft',
          foodId: draft.food.id,
          quantity: draft.referenceQuantity,
          unit: draft.displayUnit,
        },
        food: draft.food,
      })),
    [ingredients, recipeId],
  );

  const draftRecipe = useMemo(
    () => ({
      id: recipeId ?? 'draft',
      name: watchedValues.name,
      servings: 1,
      notes: undefined,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }),
    [recipeId, watchedValues.name],
  );

  const recipeTotals = useMemo(
    () => calculateRecipeTotals(draftRecipe, totalsIngredients),
    [draftRecipe, totalsIngredients],
  );

  const servingsForCalc = useMemo(() => {
    const parsed = toNumberOrUndefined(watchedValues.servings);
    return parsed !== undefined && parsed > 0 ? parsed : 1;
  }, [watchedValues.servings]);

  const portionNutrition = useMemo(
    () => calculatePortionNutrition(recipeTotals, servingsForCalc),
    [recipeTotals, servingsForCalc],
  );

  function openIngredientPicker() {
    setPickerStep('search');
    setIngredientQuery('');
    setPickerVisible(true);
  }

  function closeIngredientPicker() {
    setPickerVisible(false);
    setPickerStep('search');
    setSelectedFood(null);
    setQuantityMode('reference');
    setQuantityText('');
    setQuantityError(undefined);
    setIngredientQuery('');
    setActivePortion(undefined);
  }

  function selectFoodForIngredient(food: Food) {
    setQuantityMode('reference');
    setQuantityText('');
    setQuantityError(undefined);
    setActivePortion(undefined);
    setPickerStep('quantity');
    // The search results (foodRepository.search, above) intentionally don't carry `portions`
    // (KCAL-163b: avoids stacking a second N+1 on the library search results). Paint
    // immediately with what's already known, then upgrade to the full record -- including
    // portions, needed for the "quick portion" quantity mode below -- once the one-off
    // findById() for this single selection resolves.
    setSelectedFood(food);
    void foodRepository.findById(food.id).then((result) => {
      if (result.ok) setSelectedFood(result.value);
    });
  }

  // KCAL-164 — tapping a quick-portion pill fills the field (and switches mode/active
  // portion) but never submits by itself; the user still confirms/adjusts.
  function selectQuickPortionPill(pill: QuickPortionPill) {
    setQuantityMode(pill.mode);
    setActivePortion(pill.portion);
    setQuantityText(pill.quantityText);
    setQuantityError(undefined);
  }

  function confirmAddIngredient() {
    if (!selectedFood) return;

    const parsed = toNumberOrUndefined(quantityText);
    if (parsed === undefined || Number.isNaN(parsed)) {
      setQuantityError(t('recipeForm.errors.invalidNumber'));
      return;
    }

    // RM14: quantities (whichever mode they were entered in) must not be negative.
    const check = assertNonNegative(parsed, 'quantity');
    if (!check.ok) {
      setQuantityError(t('recipeForm.errors.negativeValue'));
      return;
    }

    // KCAL-164: the portion used for a "servings" quantity is whichever one the user tapped
    // a pill for (activePortion); falling back to the food's first portion by ascending
    // `position` when the "En portions usuelles" chip was toggled directly, without a pill
    // tap -- this preserves the pre-KCAL-164 single-shortcut behavior in that case.
    const effectivePortion =
      quantityMode === 'servings' ? (activePortion ?? selectedFood.portions[0]) : undefined;

    // Convert BEFORE storing: RecipeIngredient.quantity must always be reference-unit-equivalent
    // (see convertPortionToReferenceQuantity's doc comment) -- this is the step that prevents
    // "portions" and reference-unit quantities from silently getting mixed at calculation time.
    const referenceQuantity = effectivePortion
      ? convertPortionToReferenceQuantity(effectivePortion, parsed)
      : parsed;
    const displayUnit = effectivePortion ? effectivePortion.label : selectedFood.referenceUnit;

    setIngredients((prev) => [
      ...prev,
      {
        tempId: `draft-${nextTempId.current++}`,
        food: selectedFood,
        referenceQuantity,
        displayQuantity: parsed,
        displayUnit,
        portionId: effectivePortion?.id,
      },
    ]);

    closeIngredientPicker();
  }

  function removeIngredient(tempId: string) {
    setIngredients((prev) => prev.filter((draft) => draft.tempId !== tempId));
  }

  // KCAL-155: a recipe with zero ingredients has no product value (per-portion calories
  // would read 0), so the save action is structurally disabled -- visible before the tap,
  // not revealed as an error after it. Kept in sync at both submit entry points below.
  const canSubmit = ingredients.length > 0 && !submitting;

  async function onValid(values: RecipeFormValues) {
    if (ingredients.length === 0) {
      setRootError(t('recipeForm.errors.noIngredients'));
      return;
    }

    setSubmitting(true);
    setRootError(undefined);

    const input: CreateRecipeInput = {
      name: values.name.trim(),
      servings: parseLocaleNumber(values.servings),
      notes: undefined,
      isFavorite: values.isFavorite,
      ingredients: ingredients.map((draft) => ({
        foodId: draft.food.id,
        quantity: draft.referenceQuantity,
        unit: draft.displayUnit,
        portionId: draft.portionId,
      })),
    };

    const result =
      isEditMode && recipeId
        ? await recipeRepository.update(recipeId, input)
        : await recipeRepository.create(input);

    setSubmitting(false);

    if (!result.ok) {
      setRootError(formatSubmitError(result.error, t));
      return;
    }

    navigation.goBack();
  }

  return {
    loading,
    loadError,
    control,
    handleSubmit,
    errors,
    ingredients,
    removeIngredient,
    totalWeight,
    totalWeightUnit,
    servingsForCalc,
    portionNutrition,
    submitting,
    rootError,
    canSubmit,
    onValid,
    openIngredientPicker,
    // Grouped for a single `<IngredientPickerSheet {...form.picker} />` spread -- keys are
    // named to match IngredientPickerSheetProps directly (see IngredientPickerSheet.tsx).
    picker: {
      visible: pickerVisible,
      step: pickerStep,
      onClose: closeIngredientPicker,
      ingredientQuery,
      onQueryChange: setIngredientQuery,
      foodResults,
      onSelectFood: selectFoodForIngredient,
      selectedFood,
      quantityMode,
      onQuantityModeChange: setQuantityMode,
      quantityText,
      onQuantityTextChange: setQuantityText,
      quantityError,
      activePortion,
      onSelectPill: selectQuickPortionPill,
      onConfirm: confirmAddIngredient,
      onCancel: closeIngredientPicker,
    },
  };
}
