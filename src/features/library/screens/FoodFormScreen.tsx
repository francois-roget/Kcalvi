import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { foodRepository } from '@/data/repositories';
import { calculateProportionalNutrition } from '@/domain/calculations';
import type { DomainError, Food } from '@/domain/types';
import { assertNonNegative } from '@/domain/validation';
import type { CreateFoodInput } from '@/data/repositories/FoodRepository';
import type { FoodFormScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import Chip from '@/ui/Chip';
import NumberField from '@/ui/NumberField';
import QuickPortionButton from '@/ui/QuickPortionButton';
import Text from '@/ui/Text';
import TextField from '@/ui/TextField';
import Toggle from '@/ui/Toggle';
import { formatDecimal, formatInteger, parseLocaleNumber } from '@/utils/format';

/**
 * The `Food` domain type (src/domain/types/entities.ts) only stores a single
 * `servingQuantity`/`servingUnit` pair, not an array of portions. "Portions rapides"
 * (screens.md 2j: "pills existantes + « + Ajouter »") is therefore implemented as a
 * UI-only quick-fill affordance for that single field, not a real multi-portion list —
 * see the final report for the ambiguity this leaves open.
 */
type ReferenceUnit = 'g' | 'ml' | 'unit';

const REFERENCE_UNITS: ReferenceUnit[] = ['g', 'ml', 'unit'];

type FoodFormValues = {
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

const LoadingContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/** For "pour 100 g" / "pour 100 ml" the reference is 100 units; "par unité" refers to a single unit. */
function referenceQuantityFor(unit: ReferenceUnit): number {
  return unit === 'unit' ? 1 : 100;
}

/** Converts a domain number to the comma-decimal text NumberField/parseLocaleNumber expect. */
function numberToText(value: number | undefined): string {
  // Belt-and-braces: the data/repositories mapping layer (mapping.ts's `optional()`) should
  // already normalize a WatermelonDB `null` to `undefined` before it ever reaches this screen,
  // but this guard keeps a future mapping regression from leaking the literal string "null".
  if (value === undefined || value === null) return '';
  return String(value).replace('.', ',');
}

function toNumberOrZero(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return parseLocaleNumber(trimmed);
}

function toNumberOrUndefined(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return parseLocaleNumber(trimmed);
}

/**
 * Builds the displayed error text from `error.code` — never use `error.message` directly
 * (domain/ stays locale-independent, see TECHNICAL_SPECS.MD §2.2).
 */
function validateNumberField(
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
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
  t: (key: string, options?: Record<string, unknown>) => string,
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

export function FoodFormScreen({ route, navigation }: FoodFormScreenProps) {
  const { t } = useTranslation();
  const foodId = route.params?.foodId;
  const isEditMode = foodId !== undefined;

  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rootError, setRootError] = useState<string | undefined>(undefined);

  // "Portions rapides" quick-fill for the food's single servingQuantity/servingUnit pair.
  const [servingQuantity, setServingQuantity] = useState<number | undefined>(undefined);
  const [servingUnit, setServingUnit] = useState<ReferenceUnit | undefined>(undefined);
  const [editingPortion, setEditingPortion] = useState(false);
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
      setServingQuantity(food.servingQuantity);
      setServingUnit((food.servingUnit as ReferenceUnit | undefined) ?? undefined);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, foodId, reset]);

  const caloriesLabel = t('foodForm.calories');
  const proteinLabel = t('foodForm.protein');
  const carbsLabel = t('foodForm.carbs');
  const fatLabel = t('foodForm.fat');
  const fiberLabel = t('foodForm.fiber');
  const sugarLabel = t('foodForm.sugar');

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
      servingQuantity,
      servingUnit,
      category: undefined,
      barcode: undefined,
      source: undefined,
      isFavorite: watchedValues.isFavorite,
      isArchived: false,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }),
    [watchedValues, servingQuantity, servingUnit],
  );

  const previewQuantity =
    servingQuantity !== undefined && servingQuantity > 0
      ? servingQuantity
      : previewFood.referenceQuantity;
  const previewUnitCode: ReferenceUnit =
    servingQuantity !== undefined && servingQuantity > 0 && servingUnit
      ? servingUnit
      : watchedValues.referenceUnit;

  const previewNutrition = useMemo(
    () => calculateProportionalNutrition(previewFood, previewQuantity),
    [previewFood, previewQuantity],
  );

  function openPortionEditor() {
    setPortionQuantityText(servingQuantity !== undefined ? numberToText(servingQuantity) : '');
    setPortionUnit(servingUnit ?? watchedValues.referenceUnit);
    setEditingPortion(true);
  }

  function confirmPortion() {
    const parsed = toNumberOrUndefined(portionQuantityText);
    if (parsed === undefined || Number.isNaN(parsed) || parsed < 0) {
      setEditingPortion(false);
      return;
    }
    setServingQuantity(parsed);
    setServingUnit(portionUnit);
    setEditingPortion(false);
  }

  function cancelPortionEdit() {
    setEditingPortion(false);
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
      servingQuantity,
      servingUnit,
      category: values.category.trim() || undefined,
      isFavorite: values.isFavorite,
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

  if (loading) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="body" color="text.secondary">
            {t('foodForm.loading')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <HeaderRow>
        <Button
          testID="foodForm.header.cancel"
          label={t('foodForm.header.cancel')}
          variant="ghost"
          size="md"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title">
          {isEditMode ? t('foodForm.header.editTitle') : t('foodForm.header.createTitle')}
        </Text>
        <Button
          testID="foodForm.header.save"
          label={t('foodForm.header.save')}
          variant="ghost"
          size="md"
          disabled={submitting}
          onPress={handleSubmit(onValid)}
        />
      </HeaderRow>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Content>
          {loadError ? (
            <Text variant="bodySm" color="text.accent">
              {t('foodForm.notFoundError')}
            </Text>
          ) : null}

          <Controller
            control={control}
            name="name"
            rules={{
              validate: (value) => value.trim().length > 0 || t('foodForm.errors.nameRequired'),
            }}
            render={({ field }) => (
              <TextField
                testID="foodForm.name"
                label={t('foodForm.name')}
                placeholder={t('foodForm.namePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="brand"
            render={({ field }) => (
              <TextField
                testID="foodForm.brand"
                label={t('foodForm.brand')}
                placeholder={t('foodForm.brandPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="referenceUnit"
            render={({ field }) => (
              <ChipRow>
                {REFERENCE_UNITS.map((unit) => (
                  <Chip
                    key={unit}
                    testID={`foodForm.referenceUnit.${unit}`}
                    label={t(`foodForm.referenceUnits.${unit}`)}
                    selected={field.value === unit}
                    onPress={() => field.onChange(unit)}
                  />
                ))}
              </ChipRow>
            )}
          />

          <Row>
            <FieldGroup>
              <Controller
                control={control}
                name="calories"
                rules={{
                  validate: (value) =>
                    validateNumberField(
                      value,
                      t,
                      caloriesLabel,
                      t('foodForm.errors.caloriesRequired'),
                    ),
                }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.calories"
                    label={caloriesLabel}
                    unit={t('foodForm.kcalUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.calories?.message}
                  />
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <Controller
                control={control}
                name="protein"
                rules={{ validate: (value) => validateNumberField(value, t, proteinLabel) }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.protein"
                    label={proteinLabel}
                    unit={t('foodForm.gramUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.protein?.message}
                  />
                )}
              />
            </FieldGroup>
          </Row>

          <Row>
            <FieldGroup>
              <Controller
                control={control}
                name="carbs"
                rules={{ validate: (value) => validateNumberField(value, t, carbsLabel) }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.carbs"
                    label={carbsLabel}
                    unit={t('foodForm.gramUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.carbs?.message}
                  />
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <Controller
                control={control}
                name="fat"
                rules={{ validate: (value) => validateNumberField(value, t, fatLabel) }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.fat"
                    label={fatLabel}
                    unit={t('foodForm.gramUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.fat?.message}
                  />
                )}
              />
            </FieldGroup>
          </Row>

          <Row>
            <FieldGroup>
              <Controller
                control={control}
                name="fiber"
                rules={{ validate: (value) => validateNumberField(value, t, fiberLabel) }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.fiber"
                    label={fiberLabel}
                    unit={t('foodForm.gramUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.fiber?.message}
                  />
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <Controller
                control={control}
                name="sugar"
                rules={{ validate: (value) => validateNumberField(value, t, sugarLabel) }}
                render={({ field }) => (
                  <NumberField
                    testID="foodForm.sugar"
                    label={sugarLabel}
                    unit={t('foodForm.gramUnit')}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.sugar?.message}
                  />
                )}
              />
            </FieldGroup>
          </Row>

          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <TextField
                testID="foodForm.category"
                label={t('foodForm.category')}
                placeholder={t('foodForm.categoryPlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />

          <Text variant="title">{t('foodForm.quickPortions.title')}</Text>
          <ChipRow>
            {servingQuantity !== undefined ? (
              <QuickPortionButton
                testID="foodForm.quickPortions.existing"
                label={`${numberToText(servingQuantity)} ${t(`foodForm.units.${servingUnit ?? 'g'}`)}`}
                selected
                onPress={openPortionEditor}
              />
            ) : null}
            <QuickPortionButton
              testID="foodForm.quickPortions.add"
              label={t('foodForm.quickPortions.add')}
              onPress={openPortionEditor}
            />
          </ChipRow>

          {editingPortion ? (
            <Card tone="muted">
              <Row>
                <FieldGroup>
                  <NumberField
                    testID="foodForm.quickPortions.quantity"
                    label={t('foodForm.quickPortions.quantityLabel')}
                    value={portionQuantityText}
                    onChangeText={setPortionQuantityText}
                  />
                </FieldGroup>
                <FieldGroup>
                  <ChipRow>
                    {REFERENCE_UNITS.map((unit) => (
                      <Chip
                        key={unit}
                        testID={`foodForm.quickPortions.unit.${unit}`}
                        label={t(`foodForm.units.${unit}`)}
                        selected={portionUnit === unit}
                        onPress={() => setPortionUnit(unit)}
                      />
                    ))}
                  </ChipRow>
                </FieldGroup>
              </Row>
              <Row style={{ marginTop: 12 }}>
                <Button
                  testID="foodForm.quickPortions.cancel"
                  label={t('foodForm.quickPortions.cancel')}
                  variant="secondary"
                  size="md"
                  onPress={cancelPortionEdit}
                />
                <Button
                  testID="foodForm.quickPortions.confirm"
                  label={t('foodForm.quickPortions.confirm')}
                  variant="primary"
                  size="md"
                  onPress={confirmPortion}
                />
              </Row>
            </Card>
          ) : null}

          <Card tone="accent" testID="foodForm.preview">
            <Text variant="overline" color="text.tertiary">
              {t('foodForm.preview.title', {
                quantity: formatInteger(previewQuantity),
                unit: t(`foodForm.units.${previewUnitCode}`),
              })}
            </Text>
            <Text variant="body" color="text.primary" style={{ marginTop: 4 }}>
              {t('foodForm.preview.summary', {
                calories: formatInteger(previewNutrition.calories),
                protein: formatDecimal(previewNutrition.protein),
                carbs: formatDecimal(previewNutrition.carbs),
                fat: formatDecimal(previewNutrition.fat),
              })}
            </Text>
          </Card>

          <Card tone="light">
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="body">{t('foodForm.favorite')}</Text>
              <Controller
                control={control}
                name="isFavorite"
                render={({ field }) => (
                  <Toggle value={field.value} onValueChange={field.onChange} />
                )}
              />
            </Row>
          </Card>

          {rootError ? (
            <Text variant="bodySm" color="text.accent" testID="foodForm.rootError">
              {rootError}
            </Text>
          ) : null}

          <Button
            testID="foodForm.submit"
            label={t('foodForm.submit')}
            variant="primary"
            onPress={handleSubmit(onValid)}
            disabled={submitting}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default FoodFormScreen;
