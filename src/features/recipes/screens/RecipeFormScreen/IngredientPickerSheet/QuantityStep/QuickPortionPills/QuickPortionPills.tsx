import { useTranslation } from 'react-i18next';

import type { Food } from '@/domain/types';
import QuickPortionButton from '@/ui/QuickPortionButton';

import { buildQuickPortionPills, type QuickPortionPill } from '../../../RecipeFormScreen.helpers';
import { ChipRow, styles } from './QuickPortionPills.styles';

export type QuickPortionPillsProps = {
  food: Food;
  onSelectPill: (pill: QuickPortionPill) => void;
};

/** KCAL-164 — up to 3 quick-portion shortcuts derived from the food (saved portions, "by
 * unit" counts, or reference-quantity ratios -- see buildQuickPortionPills' doc comment). */
export function QuickPortionPills({ food, onSelectPill }: QuickPortionPillsProps) {
  const { t } = useTranslation();

  return (
    <ChipRow style={styles.quickPortions} testID="recipeForm.ingredientPicker.quickPortions">
      {buildQuickPortionPills(food, t).map((pill) => (
        <QuickPortionButton
          key={pill.key}
          testID={`recipeForm.ingredientPicker.pill.${pill.key}`}
          label={pill.label}
          onPress={() => onSelectPill(pill)}
        />
      ))}
    </ChipRow>
  );
}

export default QuickPortionPills;
