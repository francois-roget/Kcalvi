import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NumberField from '@/ui/NumberField';
import TextField from '@/ui/TextField';
import { formatInteger, unitLabel } from '@/utils/format';

import type { RecipeFormValues } from '../RecipeFormScreen.helpers';
import { validateName, validateServings } from './RecipeFieldsSection.helpers';
import { FieldGroup, Row } from './RecipeFieldsSection.styles';

export type RecipeFieldsSectionProps = {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  servingsForCalc: number;
  totalWeight: number;
  totalWeightUnit: string | null;
};

/**
 * Recipe name + "Nombre de portions" / total-weight fields (KCAL-131). Total weight is
 * read-only, derived live from the ingredient list (see RecipeFormScreen.helpers.ts).
 */
export function RecipeFieldsSection({
  control,
  errors,
  servingsForCalc,
  totalWeight,
  totalWeightUnit,
}: RecipeFieldsSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <Controller
        control={control}
        name="name"
        rules={{ validate: (value) => validateName(value, t) }}
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
            rules={{ validate: (value) => validateServings(value, t) }}
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
            accessibilityHint={totalWeightUnit ? undefined : t('recipeForm.totalWeightMixedHint')}
            editable={false}
          />
        </FieldGroup>
      </Row>
    </>
  );
}

export default RecipeFieldsSection;
