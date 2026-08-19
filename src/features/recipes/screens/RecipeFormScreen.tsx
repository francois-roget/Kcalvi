import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import { database } from '@/data/database';
import { foodRepository, recipeRepository } from '@/data/repositories';
import type { CreateRecipeInput } from '@/data/repositories/RecipeRepository';
import { getRecipeWithIngredients } from '@/data/repositories/getRecipeWithIngredients';
import {
  calculatePortionNutrition,
  calculateProportionalNutrition,
  calculateRecipeTotals,
  convertServingsToReferenceQuantity,
} from '@/domain/calculations';
import type { DomainError, Food, NutritionValues, RecipeIngredient } from '@/domain/types';
import { assertNonNegative } from '@/domain/validation';
import { useObservable } from '@/hooks/useObservable';
import type { RecipeFormScreenProps } from '@/navigation/types';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import Chip from '@/ui/Chip';
import HeroCard from '@/ui/HeroCard';
import ListCard from '@/ui/ListCard';
import NumberField from '@/ui/NumberField';
import SearchField from '@/ui/SearchField';
import Text from '@/ui/Text';
import TextField from '@/ui/TextField';
import type { Theme } from '@/ui/theme';
import Toggle from '@/ui/Toggle';
import { formatDecimal, formatInteger, parseLocaleNumber, unitLabel } from '@/utils/format';

// Light debounce for the ingredient picker's food search (mirrors LibraryScreen's KCAL-103 pattern).
const SEARCH_DEBOUNCE_MS = 250;

const EMPTY_FOODS: Food[] = [];

type QuantityMode = 'reference' | 'servings';
type PickerStep = 'search' | 'quantity';

/**
 * Local draft shape for an ingredient row while the form is open.
 *
 * `referenceQuantity` is always expressed in `food.referenceUnit` terms -- it's exactly
 * what gets sent as `RecipeIngredient.quantity` on submit (see convertServingsToReferenceQuantity's
 * doc comment: `calculateProportionalNutrition` has no unit awareness, so the conversion from
 * "portions" must happen before the write, not at calculation time).
 *
 * `displayQuantity`/`displayUnit` are what the user actually typed/picked (e.g. "2" + "unité"
 * for "2 eggs"), kept separately so the ingredient list can show a human-readable amount instead
 * of the (potentially large) reference-unit-converted number.
 */
type IngredientDraft = {
  tempId: string;
  food: Food;
  referenceQuantity: number;
  displayQuantity: number;
  displayUnit: string;
};

type RecipeFormValues = {
  name: string;
  servings: string;
  isFavorite: boolean;
};

const DEFAULT_VALUES: RecipeFormValues = {
  name: '',
  servings: '1',
  isFavorite: false,
};

const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing[3]}px;
`;

const Content = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[8]}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

const FieldGroup = styled.View`
  flex: 1;
`;

const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const SectionBlock = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const HeroRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[4]}px;
`;

const HeroColumn = styled.View`
  flex: 1;
  align-items: center;
  gap: 4px;
`;

const HeroDivider = styled.View`
  width: 1px;
  align-self: stretch;
  background-color: ${({ theme }) => theme.colors.ink[700]};
`;

const PickerResultRow = styled(Pressable)`
  padding-vertical: ${({ theme }) => theme.spacing[3]}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border.subtle};
`;

/** Converts a domain number to the comma-decimal text NumberField/parseLocaleNumber expect. */
function numberToText(value: number): string {
  return String(value).replace('.', ',');
}

function toNumberOrUndefined(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return parseLocaleNumber(trimmed);
}

/**
 * Reconstructs what the user originally typed for an ingredient loaded from storage
 * (edit mode). `RecipeIngredient` only persists the reference-unit-equivalent `quantity` plus a
 * display-only `unit`, so if that unit matches the food's `servingUnit` we can back out the
 * original "N portions" value (quantity / servingQuantity); otherwise the ingredient was entered
 * directly in the reference unit, and quantity/unit are shown as-is.
 */
function deriveIngredientDisplay(
  food: Food,
  ingredient: RecipeIngredient,
): { displayQuantity: number; displayUnit: string } {
  if (
    food.servingQuantity !== undefined &&
    food.servingQuantity > 0 &&
    food.servingUnit !== undefined &&
    ingredient.unit === food.servingUnit
  ) {
    return {
      displayQuantity: ingredient.quantity / food.servingQuantity,
      displayUnit: ingredient.unit,
    };
  }
  return { displayQuantity: ingredient.quantity, displayUnit: ingredient.unit };
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

type IngredientRowProps = {
  draft: IngredientDraft;
  kcal: number;
  onDelete: () => void;
  isLast?: boolean;
};

/**
 * KCAL-132 — a row of the ingredients ListCard: name, quantity + unit (as the user entered
 * them), computed kcal, and a delete action. Nested Pressable (delete) inside a non-pressable
 * row: there's no row-level onPress here, so there's no bubbling concern, but the delete target
 * is still wrapped in its own Pressable with hitSlop for a comfortable tap target (LibraryScreen
 * convention).
 */
function IngredientRow({ draft, kcal, onDelete, isLast }: IngredientRowProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
        paddingVertical: 13,
        paddingHorizontal: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border.subtle,
      }}
    >
      <View style={{ flexShrink: 1, paddingRight: 12 }}>
        <Text variant="body" color="text.primary">
          {draft.food.name}
        </Text>
        <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
          {formatDecimal(draft.displayQuantity)} {unitLabel(t, draft.displayUnit)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text variant="bodySm" color="text.secondary">
          {t('recipeForm.ingredients.kcalValue', { value: formatInteger(kcal) })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('recipeForm.ingredients.deleteLabel', { name: draft.food.name })}
          hitSlop={10}
          testID={`recipeForm.ingredient.${draft.tempId}.delete`}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={19} color={theme.colors.text.tertiary} />
        </Pressable>
      </View>
    </View>
  );
}

export function RecipeFormScreen({ route, navigation }: RecipeFormScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const recipeId = route.params?.recipeId;
  const isEditMode = recipeId !== undefined;

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
          const { displayQuantity, displayUnit } = deriveIngredientDisplay(food, ingredient);
          return {
            tempId: ingredient.id,
            food,
            referenceQuantity: ingredient.quantity,
            displayQuantity,
            displayUnit,
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

  const portionNutrition: NutritionValues = useMemo(
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
  }

  function selectFoodForIngredient(food: Food) {
    setSelectedFood(food);
    setQuantityMode('reference');
    setQuantityText('');
    setQuantityError(undefined);
    setPickerStep('quantity');
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

    // Convert BEFORE storing: RecipeIngredient.quantity must always be reference-unit-equivalent
    // (see convertServingsToReferenceQuantity's doc comment) -- this is the step that prevents
    // "portions" and reference-unit quantities from silently getting mixed at calculation time.
    const referenceQuantity =
      quantityMode === 'servings'
        ? convertServingsToReferenceQuantity(selectedFood, parsed)
        : parsed;
    const displayUnit =
      quantityMode === 'servings'
        ? (selectedFood.servingUnit ?? selectedFood.referenceUnit)
        : selectedFood.referenceUnit;

    setIngredients((prev) => [
      ...prev,
      {
        tempId: `draft-${nextTempId.current++}`,
        food: selectedFood,
        referenceQuantity,
        displayQuantity: parsed,
        displayUnit,
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

  if (loading) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="body" color="text.secondary">
            {t('recipeForm.loading')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <HeaderRow>
        <Button
          testID="recipeForm.header.cancel"
          label={t('recipeForm.header.cancel')}
          variant="ghost"
          size="md"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title">
          {isEditMode ? t('recipeForm.header.editTitle') : t('recipeForm.header.createTitle')}
        </Text>
        <Button
          testID="recipeForm.header.save"
          label={t('recipeForm.header.save')}
          variant="ghost"
          size="md"
          disabled={!canSubmit}
          accessibilityHint={canSubmit ? undefined : t('recipeForm.submitDisabledHint')}
          onPress={handleSubmit(onValid)}
        />
      </HeaderRow>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Content>
          {loadError ? (
            <Text variant="bodySm" color="text.accent">
              {t('recipeForm.loadError')}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="name"
            rules={{
              validate: (value) => value.trim().length > 0 || t('recipeForm.errors.nameRequired'),
            }}
            render={({ field }) => (
              <TextField
                testID="recipeForm.name"
                label={t('recipeForm.name')}
                placeholder={t('recipeForm.namePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Row>
            <FieldGroup>
              <Controller
                control={control}
                name="servings"
                rules={{
                  validate: (value) => {
                    const parsed = toNumberOrUndefined(value);
                    if (parsed === undefined || Number.isNaN(parsed) || parsed <= 0) {
                      return t('recipeForm.errors.servingsInvalid');
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <NumberField
                    testID="recipeForm.servings"
                    label={t('recipeForm.servings')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.servings?.message}
                    hint={t('recipeForm.servingsHint', { count: servingsForCalc })}
                  />
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <NumberField
                testID="recipeForm.totalWeight"
                label={t('recipeForm.totalWeight')}
                unit={totalWeightUnit ? unitLabel(t, totalWeightUnit) : undefined}
                value={totalWeightUnit ? formatInteger(totalWeight) : '—'}
                accessibilityHint={
                  totalWeightUnit ? undefined : t('recipeForm.totalWeightMixedHint')
                }
                editable={false}
              />
            </FieldGroup>
          </Row>

          <SectionBlock>
            <Text variant="overline" color="text.tertiary">
              {t('recipeForm.ingredients.title')}
            </Text>

            {ingredients.length === 0 ? (
              <Text variant="bodySm" color="text.tertiary">
                {t('recipeForm.ingredients.empty')}
              </Text>
            ) : (
              <ListCard>
                {ingredients.map((draft) => (
                  <IngredientRow
                    key={draft.tempId}
                    draft={draft}
                    kcal={
                      calculateProportionalNutrition(draft.food, draft.referenceQuantity).calories
                    }
                    onDelete={() => removeIngredient(draft.tempId)}
                  />
                ))}
              </ListCard>
            )}

            <Pressable
              accessibilityRole="button"
              testID="recipeForm.addIngredient"
              onPress={openIngredientPicker}
            >
              <Card tone="dashed">
                <Text variant="body" color="text.accent" style={{ textAlign: 'center' }}>
                  {t('recipeForm.addIngredient')}
                </Text>
              </Card>
            </Pressable>
          </SectionBlock>

          <HeroCard>
            <Text variant="overline" color="onDark.subtle">
              {t('recipeForm.perPortion.title')}
            </Text>
            <Text variant="stat" color="onDark.primary" style={{ marginTop: 8 }}>
              {t('recipeForm.perPortion.kcalValue', {
                value: formatInteger(portionNutrition.calories),
              })}
            </Text>

            <HeroRow>
              <HeroColumn>
                <Text variant="title" style={{ color: theme.colors.terracotta[300] }}>
                  {formatDecimal(portionNutrition.protein)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('recipeForm.perPortion.protein')}
                </Text>
              </HeroColumn>

              <HeroDivider />

              <HeroColumn>
                <Text variant="title" style={{ color: theme.colors.azure[400] }}>
                  {formatDecimal(portionNutrition.carbs)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('recipeForm.perPortion.carbs')}
                </Text>
              </HeroColumn>

              <HeroDivider />

              <HeroColumn>
                <Text variant="title" color="onDark.primary">
                  {formatDecimal(portionNutrition.fat)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('recipeForm.perPortion.fat')}
                </Text>
              </HeroColumn>
            </HeroRow>
          </HeroCard>

          {rootError ? (
            <Text variant="bodySm" color="text.accent" testID="recipeForm.rootError">
              {rootError}
            </Text>
          ) : null}

          <Card tone="light">
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="body">{t('recipeForm.favorite')}</Text>
              <Controller
                control={control}
                name="isFavorite"
                render={({ field }) => (
                  <Toggle
                    testID="recipeForm.favorite"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
            </Row>
          </Card>

          <Button
            testID="recipeForm.submit"
            label={t('recipeForm.submit')}
            variant="primary"
            onPress={handleSubmit(onValid)}
            disabled={!canSubmit}
            accessibilityHint={canSubmit ? undefined : t('recipeForm.submitDisabledHint')}
          />
        </Content>
      </ScrollView>

      <BottomSheet visible={pickerVisible} onClose={closeIngredientPicker} minHeightRatio={0.7}>
        {pickerStep === 'search' ? (
          <View testID="recipeForm.ingredientPicker.search" style={{ flex: 1, flexShrink: 1 }}>
            <Text variant="h2">{t('recipeForm.picker.searchTitle')}</Text>
            <View style={{ marginTop: 12 }}>
              <SearchField
                value={ingredientQuery}
                onChangeText={setIngredientQuery}
                onClear={() => setIngredientQuery('')}
                placeholder={t('recipeForm.picker.searchPlaceholder')}
                accessibilityLabel={t('recipeForm.picker.searchPlaceholder')}
                autoCapitalize="none"
                autoCorrect={false}
                testID="recipeForm.ingredientPicker.searchField"
              />
            </View>

            <ScrollView style={{ marginTop: 12, flex: 1 }} keyboardShouldPersistTaps="handled">
              {foodResults.length === 0 ? (
                <Text variant="bodySm" color="text.tertiary" style={{ paddingVertical: 12 }}>
                  {t('recipeForm.picker.noResults')}
                </Text>
              ) : (
                foodResults.map((food) => (
                  <PickerResultRow
                    key={food.id}
                    accessibilityRole="button"
                    testID={`recipeForm.ingredientPicker.result.${food.id}`}
                    onPress={() => selectFoodForIngredient(food)}
                  >
                    <Text variant="body" color="text.primary">
                      {food.name}
                    </Text>
                    <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
                      {formatInteger(food.referenceQuantity)} {unitLabel(t, food.referenceUnit)}
                    </Text>
                  </PickerResultRow>
                ))
              )}
            </ScrollView>
          </View>
        ) : selectedFood ? (
          <View testID="recipeForm.ingredientPicker.quantity">
            <Text variant="h2">{selectedFood.name}</Text>

            <ChipRow style={{ marginTop: 12 }}>
              <Chip
                testID="recipeForm.ingredientPicker.mode.reference"
                label={t('recipeForm.picker.modeReference', {
                  unit: unitLabel(t, selectedFood.referenceUnit),
                })}
                selected={quantityMode === 'reference'}
                onPress={() => setQuantityMode('reference')}
              />
              {selectedFood.servingQuantity !== undefined ? (
                <Chip
                  testID="recipeForm.ingredientPicker.mode.servings"
                  label={t('recipeForm.picker.modeServings')}
                  selected={quantityMode === 'servings'}
                  onPress={() => setQuantityMode('servings')}
                />
              ) : null}
            </ChipRow>

            <View style={{ marginTop: 12 }}>
              <NumberField
                testID="recipeForm.ingredientPicker.quantityField"
                label={
                  quantityMode === 'servings'
                    ? t('recipeForm.picker.servingsLabel')
                    : t('recipeForm.picker.quantityLabel')
                }
                unit={
                  quantityMode === 'servings'
                    ? unitLabel(t, selectedFood.servingUnit ?? selectedFood.referenceUnit)
                    : unitLabel(t, selectedFood.referenceUnit)
                }
                value={quantityText}
                onChangeText={setQuantityText}
                error={quantityError}
              />
            </View>

            <Row style={{ marginTop: 16 }}>
              <Button
                testID="recipeForm.ingredientPicker.cancel"
                label={t('recipeForm.picker.cancel')}
                variant="secondary"
                size="md"
                onPress={closeIngredientPicker}
              />
              <Button
                testID="recipeForm.ingredientPicker.confirm"
                label={t('recipeForm.picker.confirm')}
                variant="primary"
                size="md"
                onPress={confirmAddIngredient}
              />
            </Row>
          </View>
        ) : null}
      </BottomSheet>
    </Safe>
  );
}

export default RecipeFormScreen;
