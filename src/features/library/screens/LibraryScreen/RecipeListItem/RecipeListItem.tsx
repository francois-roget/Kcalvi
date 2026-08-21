import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Recipe } from '@/domain/types';
import Card from '@/ui/Card';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatInteger } from '@/utils/format';

import { CardActions, CardRow, styles } from './RecipeListItem.styles';

export type RecipeListItemProps = {
  recipe: Recipe;
  /** Per-portion kcal (KCAL-158), `undefined` while `getRecipesCalories` hasn't
   *  resolved yet -- never rendered as "0 kcal", which would be a false reading. */
  kcalPerPortion: number | undefined;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDeletePress: () => void;
};

/**
 * KCAL-142/144/162 — Card light item: tap navigates to the recipe detail, tap ★
 * toggles favorite inline, tap the trash icon opens the archive confirmation
 * (same nested-Pressable pattern as `FoodListItem` so the star/trash taps
 * never also trigger the outer card's onPress).
 */
export function RecipeListItem({
  recipe,
  kcalPerPortion,
  onPress,
  onToggleFavorite,
  onDeletePress,
}: RecipeListItemProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      testID={`library.recipeCard.${recipe.id}`}
      onPress={onPress}
    >
      <Card tone="light">
        <CardRow>
          <View style={styles.nameColumn}>
            <Text variant="body" color="text.primary">
              {recipe.name}
            </Text>
            <Text variant="caption" color="text.tertiary" style={styles.kcalLabel}>
              {kcalPerPortion === undefined
                ? t('library.recipe.servings', { count: recipe.servings })
                : t('library.recipe.kcalPerPortion', {
                    kcal: formatInteger(kcalPerPortion),
                    count: recipe.servings,
                  })}
            </Text>
          </View>

          <CardActions>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                recipe.isFavorite
                  ? t('library.recipe.removeFavorite', { name: recipe.name })
                  : t('library.recipe.addFavorite', { name: recipe.name })
              }
              accessibilityState={{ selected: recipe.isFavorite }}
              hitSlop={10}
              testID={`library.recipeCard.${recipe.id}.favorite`}
              onPress={onToggleFavorite}
            >
              <Ionicons
                name={recipe.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={recipe.isFavorite ? theme.colors.azure[400] : theme.colors.text.disabled}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.recipe.deleteLabel', { name: recipe.name })}
              hitSlop={10}
              testID={`library.recipeCard.${recipe.id}.delete`}
              onPress={onDeletePress}
            >
              <Ionicons name="trash-outline" size={19} color={theme.colors.text.tertiary} />
            </Pressable>
          </CardActions>
        </CardRow>
      </Card>
    </Pressable>
  );
}

export default RecipeListItem;
