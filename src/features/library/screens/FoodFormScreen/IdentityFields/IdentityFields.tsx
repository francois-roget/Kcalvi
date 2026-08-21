import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import TextField from '@/ui/TextField';

import type { FoodFormValues } from '../FoodFormScreen.helpers';

export type IdentityFieldsProps = {
  control: Control<FoodFormValues>;
  errors: FieldErrors<FoodFormValues>;
};

/** Name (required) + brand (optional) text fields (KCAL-116). */
export function IdentityFields({ control, errors }: IdentityFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
}

export default IdentityFields;
