import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Card from '@/ui/Card';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { foodKcalLabel, formatInteger } from '@/utils/format';

import type { EntryResult } from '../AddEntryScreen.helpers';
import { CardRow, NameRow, styles } from './EntryResultItem.styles';

export type EntryResultItemProps = {
  result: EntryResult;
  onPress: () => void;
};

/**
 * One result row (2h): name + ★ when favorited, a reference line, and a « + » button. Both the
 * row and the « + » open the same QuantitySheet — the button is there for discoverability, not
 * as a separate action, so it shares `onPress` rather than writing an entry directly (the
 * design has no quantity-less add path).
 */
export function EntryResultItem({ result, onPress }: EntryResultItemProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const isFavorite = result.kind === 'food' ? result.food.isFavorite : result.recipe.isFavorite;
  const name = result.kind === 'food' ? result.food.name : result.recipe.name;

  // Recipes show per-portion kcal from the batched map; `undefined` means
  // `getRecipesCalories` hasn't resolved yet, and falls back to the servings line rather than
  // rendering "0 kcal", which would be a false reading (same rule as RecipeListItem).
  const referenceLabel =
    result.kind === 'food'
      ? foodKcalLabel(t, result.food)
      : result.caloriesPerPortion === undefined
        ? t('library.recipe.servings', { count: result.recipe.servings })
        : t('library.recipe.kcalPerPortion', {
            kcal: formatInteger(result.caloriesPerPortion),
            count: result.recipe.servings,
          });

  return (
    <Pressable accessibilityRole="button" testID={`addEntry.result.${result.id}`} onPress={onPress}>
      <Card tone="light">
        <CardRow>
          <View style={styles.nameColumn}>
            <NameRow>
              <Text variant="body" color="text.primary" style={styles.name}>
                {name}
              </Text>
              {isFavorite ? (
                <Ionicons name="star" size={14} color={theme.colors.azure[400]} />
              ) : null}
            </NameRow>
            <Text variant="caption" color="text.tertiary" style={styles.referenceLabel}>
              {referenceLabel}
            </Text>
          </View>

          {/* Nested Pressable: RN routes the tap to the innermost Pressable, so this never
              double-fires with the row's own onPress. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('addEntry.result.addLabel', { name })}
            hitSlop={10}
            testID={`addEntry.result.${result.id}.add`}
            onPress={onPress}
          >
            <Ionicons name="add" size={22} color={theme.colors.text.primary} />
          </Pressable>
        </CardRow>
      </Card>
    </Pressable>
  );
}

export default EntryResultItem;
