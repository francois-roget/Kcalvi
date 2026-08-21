import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Food, FoodPortion } from '@/domain/types';
import Button from '@/ui/Button';
import NumberField from '@/ui/NumberField';
import Text from '@/ui/Text';
import { unitLabel } from '@/utils/format';

import type { QuantityMode, QuickPortionPill } from '../../RecipeFormScreen.helpers';
import { QuantityModeChips } from './QuantityModeChips';
import { QuickPortionPills } from './QuickPortionPills';
import { Row, styles } from './QuantityStep.styles';

export type QuantityStepProps = {
  food: Food;
  quantityMode: QuantityMode;
  onQuantityModeChange: (mode: QuantityMode) => void;
  quantityText: string;
  onQuantityTextChange: (value: string) => void;
  quantityError?: string;
  activePortion?: FoodPortion;
  onSelectPill: (pill: QuickPortionPill) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Step 2 of the ingredient picker (KCAL-133): quantity entry, either in the food's reference
 * unit or (when the food has saved portions) "servings" mode, plus up to 3 quick-portion
 * pills (KCAL-164).
 */
export function QuantityStep({
  food,
  quantityMode,
  onQuantityModeChange,
  quantityText,
  onQuantityTextChange,
  quantityError,
  activePortion,
  onSelectPill,
  onConfirm,
  onCancel,
}: QuantityStepProps) {
  const { t } = useTranslation();
  const servingsPortion = activePortion ?? food.portions[0];

  return (
    <View testID="recipeForm.ingredientPicker.quantity">
      <Text variant="h2">{food.name}</Text>

      <QuantityModeChips
        food={food}
        quantityMode={quantityMode}
        onQuantityModeChange={onQuantityModeChange}
      />

      <View style={styles.quantityField}>
        <NumberField
          testID="recipeForm.ingredientPicker.quantityField"
          label={
            quantityMode === 'servings'
              ? t('recipeForm.picker.servingsLabel')
              : t('recipeForm.picker.quantityLabel')
          }
          unit={
            quantityMode === 'servings'
              ? unitLabel(t, servingsPortion?.label ?? food.referenceUnit)
              : unitLabel(t, food.referenceUnit)
          }
          value={quantityText}
          onChangeText={onQuantityTextChange}
          error={quantityError}
        />
      </View>

      <QuickPortionPills food={food} onSelectPill={onSelectPill} />

      <Row style={styles.confirmRow}>
        <Button
          testID="recipeForm.ingredientPicker.cancel"
          label={t('recipeForm.picker.cancel')}
          variant="secondary"
          size="md"
          onPress={onCancel}
        />
        <Button
          testID="recipeForm.ingredientPicker.confirm"
          label={t('recipeForm.picker.confirm')}
          variant="primary"
          size="md"
          onPress={onConfirm}
        />
      </Row>
    </View>
  );
}

export default QuantityStep;
