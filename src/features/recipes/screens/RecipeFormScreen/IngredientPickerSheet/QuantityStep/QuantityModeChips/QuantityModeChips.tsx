import { useTranslation } from 'react-i18next';

import type { Food } from '@/domain/types';
import Chip from '@/ui/Chip';
import { unitLabel } from '@/utils/format';

import type { QuantityMode } from '../../../RecipeFormScreen.helpers';
import { ChipRow, styles } from './QuantityModeChips.styles';

export type QuantityModeChipsProps = {
  food: Food;
  quantityMode: QuantityMode;
  onQuantityModeChange: (mode: QuantityMode) => void;
};

/** Reference-unit vs "servings" mode toggle (the "servings" chip only shows up when the food
 * has saved portions to express servings in). */
export function QuantityModeChips({
  food,
  quantityMode,
  onQuantityModeChange,
}: QuantityModeChipsProps) {
  const { t } = useTranslation();

  return (
    <ChipRow style={styles.modeChips}>
      <Chip
        testID="recipeForm.ingredientPicker.mode.reference"
        label={t('recipeForm.picker.modeReference', { unit: unitLabel(t, food.referenceUnit) })}
        selected={quantityMode === 'reference'}
        onPress={() => onQuantityModeChange('reference')}
      />
      {food.portions.length > 0 ? (
        <Chip
          testID="recipeForm.ingredientPicker.mode.servings"
          label={t('recipeForm.picker.modeServings')}
          selected={quantityMode === 'servings'}
          onPress={() => onQuantityModeChange('servings')}
        />
      ) : null}
    </ChipRow>
  );
}

export default QuantityModeChips;
