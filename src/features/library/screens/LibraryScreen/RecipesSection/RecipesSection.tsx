import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Recipe } from '@/domain/types';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { RecipeListItem } from '../RecipeListItem';
import { SectionBlock } from '../SectionBlock';
import { getAddButtonStyle } from './RecipesSection.styles';

export type RecipesSectionProps = {
  recipes: Recipe[];
  /** Per-portion kcal by recipe id (KCAL-158), see `useRecipeCalories`. */
  recipeCalories: Map<string, number>;
  onRecipePress: (recipeId: string) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onArchivePress: (recipe: Recipe) => void;
  onCreatePress: () => void;
};

/**
 * KCAL-142/157 — "Recettes" section: the recipe list (or "Aucun résultat" when empty) plus
 * the "+" button that navigates to RecipeForm in create mode.
 */
export function RecipesSection({
  recipes,
  recipeCalories,
  onRecipePress,
  onToggleFavorite,
  onArchivePress,
  onCreatePress,
}: RecipesSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <SectionBlock
      testID="library.section.recipes"
      title={t('library.sections.recipes')}
      headerAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('library.addRecipeButtonLabel')}
          hitSlop={8}
          testID="library.addRecipeButton"
          onPress={onCreatePress}
          style={getAddButtonStyle(theme)}
        >
          <Ionicons name="add" size={14} color="#FFFFFF" />
        </Pressable>
      }
    >
      {recipes.length === 0 ? (
        <Text variant="bodySm" color="text.tertiary">
          {t('library.list.noResults')}
        </Text>
      ) : (
        recipes.map((recipe) => (
          <RecipeListItem
            key={recipe.id}
            recipe={recipe}
            kcalPerPortion={recipeCalories.get(recipe.id)}
            onPress={() => onRecipePress(recipe.id)}
            onToggleFavorite={() => onToggleFavorite(recipe)}
            onDeletePress={() => onArchivePress(recipe)}
          />
        ))
      )}
    </SectionBlock>
  );
}

export default RecipesSection;
