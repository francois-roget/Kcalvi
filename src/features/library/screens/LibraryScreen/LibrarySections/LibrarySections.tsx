import { useTranslation } from 'react-i18next';

import type { Food, Recipe } from '@/domain/types';
import Text from '@/ui/Text';

import { FoodsSection } from '../FoodsSection';
import type { LibraryActions } from '../LibraryScreen.helpers';
import { RecipesSection } from '../RecipesSection';

export type LibrarySectionsProps = {
  debouncedQuery: string;
  showGlobalNoResults: boolean;
  showRecipesSection: boolean;
  showFoodsSection: boolean;
  filteredRecipes: Recipe[];
  filteredFoods: Food[];
  recipeCalories: Map<string, number>;
  actions: LibraryActions;
  onArchiveRecipePress: (recipe: Recipe) => void;
  onDeleteFoodPress: (food: Food) => void;
};

/**
 * KCAL-157 — either the single global "no results" message (search matched nothing in any
 * visible section) or the Recipes/Foods sections, each independently gated by the active
 * quick filter chip.
 */
export function LibrarySections({
  debouncedQuery,
  showGlobalNoResults,
  showRecipesSection,
  showFoodsSection,
  filteredRecipes,
  filteredFoods,
  recipeCalories,
  actions,
  onArchiveRecipePress,
  onDeleteFoodPress,
}: LibrarySectionsProps) {
  const { t } = useTranslation();

  if (showGlobalNoResults) {
    return (
      <Text variant="bodySm" color="text.tertiary" testID="library.list.noResultsGlobal">
        {t('library.list.noResultsForQuery', { query: debouncedQuery })}
      </Text>
    );
  }

  return (
    <>
      {showRecipesSection ? (
        <RecipesSection
          recipes={filteredRecipes}
          recipeCalories={recipeCalories}
          onRecipePress={actions.handleRecipePress}
          onToggleFavorite={actions.handleToggleRecipeFavorite}
          onArchivePress={onArchiveRecipePress}
          onCreatePress={actions.handleCreateRecipePress}
        />
      ) : null}

      {showFoodsSection ? (
        <FoodsSection
          foods={filteredFoods}
          onFoodPress={actions.handleFoodPress}
          onToggleFavorite={actions.handleToggleFavorite}
          onDeletePress={onDeleteFoodPress}
        />
      ) : null}
    </>
  );
}

export default LibrarySections;
