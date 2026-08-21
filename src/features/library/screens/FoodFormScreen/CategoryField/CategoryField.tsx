import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import TextField from '@/ui/TextField';

import type { FoodFormValues } from '../FoodFormScreen.helpers';

export type CategoryFieldProps = {
  control: Control<FoodFormValues>;
};

/** Optional free-text category field. */
export function CategoryField({ control }: CategoryFieldProps) {
  const { t } = useTranslation();

  return (
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
  );
}

export default CategoryField;
