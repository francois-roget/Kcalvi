import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { foodRepository } from '@/data/repositories';
import type { CreateFoodInput } from '@/data/repositories/FoodRepository';
import { calculateProportionalNutrition } from '@/domain/calculations';
import type { DomainError, Food } from '@/domain/types';
import { assertNonNegative } from '@/domain/validation';
import type { FoodFormScreenProps } from '@/navigation/types';
import { parseLocaleNumber } from '@/utils/format';

// KCAL-163: "Portions usuelles" is a real multi-portion list (food_portions), replacing the
// Sprint 2 single servingQuantity/servingUnit shortcut this screen used to quick-fill.
export type ReferenceUnit = 'g' | 'ml' | 'unit';

export const REFERENCE_UNITS: ReferenceUnit[] = ['g', 'ml', 'unit'];

/**
 * Local draft shape for a portion row while the form is open. `position` isn't tracked
 * explicitly -- the array's own order IS the display order (new rows are appended, deletion
 * re-derives positions from index), and `position` is only computed from that index at
 * submit/preview time.
 */
export type PortionDraft = {
  tempId: string;
  label: string;
  quantity: number;
  unit: ReferenceUnit;
};

export type FoodFormValues = {
  name: string;
  brand: string;
  referenceUnit: ReferenceUnit;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  category: string;
  isFavorite: boolean;
};

const DEFAULT_VALUES: FoodFormValues = {
  name: '',
  brand: '',
  referenceUnit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sugar: '',
  category: '',
  isFavorite: false,
};

/** Local alias for the i18next translation function, kept minimal to avoid coupling to react-i18next's full generic surface. */
export type TFunction = (key: string, options?: Record<string, unknown>) => string;

/** For "pour 100 g" / "pour 100 ml" the reference is 100 units; "par unité" refers to a single unit. */
export function referenceQuantityFor(unit: ReferenceUnit): number {
  return unit === 'unit' ? 1 : 100;
}

/** Converts a domain number to the comma-decimal text NumberField/parseLocaleNumber expect. */
export function numberToText(value: number | undefined): string {
  // Belt-and-braces: the data/repositories mapping layer (mapping.ts's `optional()`) should
  // already normalize a WatermelonDB `null` to `undefined` before it ever reaches this screen,
  // but this guard keeps a future mapping regression from leaking the literal string "null".
  if (value === undefined || value === null) return '';
  return String(value).replace('.', ',');
}

export function toNumberOrZero(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return parseLocaleNumber(trimmed);
}

export function toNumberOrUndefined(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return parseLocaleNumber(trimmed);
}

/**
 * Builds the displayed error text from `error.code` — never use `error.message` directly
 * (domain/ stays locale-independent, see TECHNICAL_SPECS.MD §2.2).
 */
export function validateNumberField(
  value: string,
  t: TFunction,
  fieldLabel: string,
  requiredMessage?: string,
): true | string {
  const trimmed = value.trim();
  if (trimmed === '') {
    return requiredMessage ?? true;
  }
  const parsed = parseLocaleNumber(trimmed);
  if (Number.isNaN(parsed)) {
    return t('validation.invalidNumber', { field: fieldLabel });
  }
  const check = assertNonNegative(parsed, fieldLabel);
  if (!check.ok) {
    return t('foodForm.errors.negativeValue', { field: fieldLabel });
  }
  return true;
}

function formatSubmitError(
  error: DomainError,
  t: TFunction,
  caloriesLabel: string,
): { field?: 'calories'; message: string } {
  if (error.code === 'NEGATIVE_VALUE') {
    return {
      field: 'calories',
      message: t('foodForm.errors.negativeValue', { field: caloriesLabel }),
    };
  }
  return { message: t('foodForm.errors.generic') };
}

/**
 * Encapsulates all of FoodFormScreen's state and logic: RHF wiring, edit-mode preload,
 * the "Portions usuelles" CRUD list (KCAL-163e), the live nutrition preview, and submit
 * handling (KCAL-116/117/118, with the null-safety fix from KCAL-152). Local to this
 * screen (not reused elsewhere), kept here per TECHNICAL_SPECS.MD §9.2.
 */
export function useFoodForm(
  route: FoodFormScreenProps['route'],
  navigation: FoodFormScreenProps['navigation'],
) {
  const { t } = useTranslation();
  const foodId = route.params?.foodId;
  const isEditMode = foodId !== undefined;

  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | undefined>(undefined);

  // "Portions usuelles" (KCAL-163): a real list of named quick portions.
  const [portions, setPortions] = useState<PortionDraft[]>([]);
  const nextPortionTempId = useRef(0);
  // `null` = editor closed, `'new'` = creating a portion, otherwise the tempId being edited.
  const [editingPortionId, setEditingPortionId] = useState<string | 'new' | null>(null);
  const [portionLabelText, setPortionLabelText] = useState('');
  const [portionQuantityText, setPortionQuantityText] = useState('');
  const [portionUnit, setPortionUnit] = useState<ReferenceUnit>('g');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FoodFormValues>({ defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (!isEditMode || !foodId) return;
    let cancelled = false;

    (async () => {
      const result = await foodRepository.findById(foodId);
      if (cancelled) return;
      setLoading(false);

      if (!result.ok) {
        setLoadError(true);
        return;
      }

      const food = result.value;
      reset({
        name: food.name,
        brand: food.brand ?? '',
        referenceUnit: (food.referenceUnit as ReferenceUnit) ?? 'g',
        calories: numberToText(food.calories),
        protein: numberToText(food.protein),
        carbs: numberToText(food.carbs),
        fat: numberToText(food.fat),
        fiber: numberToText(food.fiber),
        sugar: numberToText(food.sugar),
        category: food.category ?? '',
        isFavorite: food.isFavorite,
      });
      // `findById` returns portions already ordered by `position` (LocalFoodRepository) --
      // the array's own order is this screen's source of truth for display order.
      setPortions(
        food.portions.map((portion) => ({
          tempId: portion.id,
          label: portion.label,
          quantity: portion.quantity,
          unit: portion.unit as ReferenceUnit,
        })),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, foodId, reset]);

  const caloriesLabel = t('foodForm.calories');

  // useWatch's generic return type marks every field optional (to cover partial array
  // items), but `defaultValues` above guarantees all of this form's fields are always set.
  const watchedValues = useWatch({ control }) as FoodFormValues;

  const previewFood: Food = useMemo(
    () => ({
      id: 'preview',
      name: watchedValues.name,
      brand: undefined,
      calories: toNumberOrZero(watchedValues.calories),
      protein: toNumberOrZero(watchedValues.protein),
      carbs: toNumberOrZero(watchedValues.carbs),
      fat: toNumberOrZero(watchedValues.fat),
      fiber: undefined,
      sugar: undefined,
      referenceQuantity: referenceQuantityFor(watchedValues.referenceUnit),
      referenceUnit: watchedValues.referenceUnit,
      category: undefined,
      barcode: undefined,
      source: undefined,
      isFavorite: watchedValues.isFavorite,
      isArchived: false,
      portions: [],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }),
    [watchedValues],
  );

  // KCAL-163e: the preview reads the first portion by ascending position (the array's own
  // order), falling back to the reference quantity when there are no portions at all.
  const firstPortion = portions.length > 0 ? portions[0] : undefined;
  const previewQuantity = firstPortion ? firstPortion.quantity : previewFood.referenceQuantity;
  const previewUnitCode: ReferenceUnit = firstPortion
    ? firstPortion.unit
    : watchedValues.referenceUnit;

  const previewNutrition = useMemo(
    () => calculateProportionalNutrition(previewFood, previewQuantity),
    [previewFood, previewQuantity],
  );

  function openPortionEditor(target: string | 'new') {
    if (target === 'new') {
      setPortionLabelText('');
      setPortionQuantityText('');
      setPortionUnit(watchedValues.referenceUnit);
    } else {
      const portion = portions.find((candidate) => candidate.tempId === target);
      if (!portion) return;
      setPortionLabelText(portion.label);
      setPortionQuantityText(numberToText(portion.quantity));
      setPortionUnit(portion.unit);
    }
    setEditingPortionId(target);
  }

  function confirmPortion() {
    const parsed = toNumberOrUndefined(portionQuantityText);
    if (parsed === undefined || Number.isNaN(parsed) || parsed < 0) {
      setEditingPortionId(null);
      return;
    }
    const label = portionLabelText.trim();

    if (editingPortionId === 'new') {
      setPortions((prev) => [
        ...prev,
        {
          tempId: `draft-${nextPortionTempId.current++}`,
          label,
          quantity: parsed,
          unit: portionUnit,
        },
      ]);
    } else if (editingPortionId !== null) {
      const targetId = editingPortionId;
      setPortions((prev) =>
        prev.map((portion) =>
          portion.tempId === targetId
            ? { ...portion, label, quantity: parsed, unit: portionUnit }
            : portion,
        ),
      );
    }
    setEditingPortionId(null);
  }

  function cancelPortionEdit() {
    setEditingPortionId(null);
  }

  function removePortion(tempId: string) {
    setPortions((prev) => prev.filter((portion) => portion.tempId !== tempId));
  }

  async function onValid(values: FoodFormValues) {
    setSubmitting(true);
    setRootError(undefined);

    const input: CreateFoodInput = {
      name: values.name.trim(),
      brand: values.brand.trim() || undefined,
      calories: parseLocaleNumber(values.calories),
      protein: toNumberOrZero(values.protein),
      carbs: toNumberOrZero(values.carbs),
      fat: toNumberOrZero(values.fat),
      fiber: toNumberOrUndefined(values.fiber),
      sugar: toNumberOrUndefined(values.sugar),
      referenceQuantity: referenceQuantityFor(values.referenceUnit),
      referenceUnit: values.referenceUnit,
      category: values.category.trim() || undefined,
      isFavorite: values.isFavorite,
      // The array's own order is the display order -- `position` is derived from index here,
      // not tracked as separate draft state (see PortionDraft's doc comment).
      portions: portions.map((portion, index) => ({
        label: portion.label,
        quantity: portion.quantity,
        unit: portion.unit,
        position: index,
      })),
    };

    const result =
      isEditMode && foodId
        ? await foodRepository.update(foodId, input)
        : await foodRepository.create(input);

    setSubmitting(false);

    if (!result.ok) {
      const formatted = formatSubmitError(result.error, t, caloriesLabel);
      if (formatted.field) {
        setError(formatted.field, { type: 'server', message: formatted.message });
      } else {
        setRootError(formatted.message);
      }
      return;
    }

    navigation.goBack();
  }

  return {
    control,
    errors,
    isEditMode,
    loading,
    loadError,
    submitting,
    rootError,
    handleSubmitPress: handleSubmit(onValid),
    portions,
    editingPortionId,
    onOpenPortionEditor: openPortionEditor,
    onRemovePortion: removePortion,
    portionEditor: {
      labelText: portionLabelText,
      onLabelChange: setPortionLabelText,
      quantityText: portionQuantityText,
      onQuantityChange: setPortionQuantityText,
      unit: portionUnit,
      onUnitChange: setPortionUnit,
      onCancel: cancelPortionEdit,
      onConfirm: confirmPortion,
    },
    previewQuantity,
    previewUnitCode,
    previewNutrition,
  };
}
