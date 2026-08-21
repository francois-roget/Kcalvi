import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Chip from '@/ui/Chip';

import { REFERENCE_UNITS, type FoodFormValues } from '../FoodFormScreen.helpers';
import { ChipRow } from './ReferenceUnitField.styles';

export type ReferenceUnitFieldProps = {
  control: Control<FoodFormValues>;
};

/** "g / ml / unité" reference-unit chip selector. */
export function ReferenceUnitField({ control }: ReferenceUnitFieldProps) {
  const { t } = useTranslation();

  return (
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
  );
}

export default ReferenceUnitField;
