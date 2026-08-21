import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatDecimal, formatInteger, unitLabel } from '@/utils/format';

import type { IngredientDraft } from '../../RecipeFormScreen.helpers';
import { getRowContainerStyle, styles } from './IngredientRow.styles';

export type IngredientRowProps = {
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
export function IngredientRow({ draft, kcal, onDelete, isLast }: IngredientRowProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <View style={getRowContainerStyle(theme, isLast)}>
      <View style={styles.info}>
        <Text variant="body" color="text.primary">
          {draft.food.name}
        </Text>
        <Text variant="caption" color="text.tertiary" style={styles.quantityText}>
          {formatDecimal(draft.displayQuantity)} {unitLabel(t, draft.displayUnit)}
        </Text>
      </View>

      <View style={styles.actions}>
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

export default IngredientRow;
