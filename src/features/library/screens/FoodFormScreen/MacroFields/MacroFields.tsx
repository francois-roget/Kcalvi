import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NumberField from '@/ui/NumberField';

import { validateNumberField, type FoodFormValues } from '../FoodFormScreen.helpers';
import { MACRO_FIELD_ROWS } from './MacroFields.helpers';
import { FieldGroup, Row } from './MacroFields.styles';

export type MacroFieldsProps = {
  control: Control<FoodFormValues>;
  errors: FieldErrors<FoodFormValues>;
};

/** Calories/protein/carbs/fat/fiber/sugar, in three two-column rows (KCAL-116). */
export function MacroFields({ control, errors }: MacroFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {MACRO_FIELD_ROWS.map((fields, rowIndex) => (
        <Row key={rowIndex}>
          {fields.map(({ key, labelKey, unitKey, requiredMessageKey }) => {
            const label = t(labelKey);
            return (
              <FieldGroup key={key}>
                <Controller
                  control={control}
                  name={key}
                  rules={{
                    validate: (value) =>
                      validateNumberField(
                        value,
                        t,
                        label,
                        requiredMessageKey ? t(requiredMessageKey) : undefined,
                      ),
                  }}
                  render={({ field }) => (
                    <NumberField
                      testID={`foodForm.${key}`}
                      label={label}
                      unit={t(unitKey)}
                      value={field.value}
                      onChangeText={field.onChange}
                      error={errors[key]?.message}
                    />
                  )}
                />
              </FieldGroup>
            );
          })}
        </Row>
      ))}
    </>
  );
}

export default MacroFields;
