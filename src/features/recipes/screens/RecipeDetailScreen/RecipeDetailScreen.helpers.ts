import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { database } from '@/data/database';
import { recipeRepository } from '@/data/repositories';
import { getRecipeWithIngredients } from '@/data/repositories/getRecipeWithIngredients';
import type { CreateRecipeInput } from '@/data/repositories/RecipeRepository';
import { calculatePortionNutrition, calculateRecipeTotals } from '@/domain/calculations';
import type { Food, Recipe, RecipeIngredient } from '@/domain/types';
import type { RecipeDetailScreenProps } from '@/navigation/types';

export type RecipeWithIngredients = {
  recipe: Recipe;
  items: { ingredient: RecipeIngredient; food: Food }[];
};

/**
 * Loads the recipe + ingredients for `recipeId` and derives the recipe-level and
 * per-portion nutrition totals (KCAL-139, RM03 then F09). Recomputed whenever the loaded
 * recipe/ingredients change -- there is no local edit state on this read-only screen, so
 * this never needs to react to anything else.
 */
export function useRecipeDetailData(recipeId: string) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [data, setData] = useState<RecipeWithIngredients | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getRecipeWithIngredients(database, recipeId);
      if (cancelled) return;
      setLoading(false);

      if (!result.ok) {
        setLoadError(true);
        return;
      }

      setData(result.value);
    })();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const recipeTotals = useMemo(() => {
    if (!data) return null;
    return calculateRecipeTotals(data.recipe, data.items);
  }, [data]);

  const portionNutrition = useMemo(() => {
    if (!data || !recipeTotals) return null;
    return calculatePortionNutrition(recipeTotals, data.recipe.servings);
  }, [data, recipeTotals]);

  return { loading, loadError, data, recipeTotals, portionNutrition };
}

/**
 * KCAL-141: clones the recipe (same servings/notes/favorite) and every ingredient row via
 * `recipeRepository.create`, then lands the user directly in edit mode on the new copy so
 * they can tweak it right away instead of going back through the detail view.
 */
export function useDuplicateRecipe(
  data: RecipeWithIngredients | null,
  navigation: RecipeDetailScreenProps['navigation'],
) {
  const { t } = useTranslation();
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  async function handleDuplicate() {
    if (!data || duplicating) return;
    setDuplicating(true);
    setDuplicateError(false);

    const input: CreateRecipeInput = {
      name: t('recipeDetail.duplicate.copyName', { name: data.recipe.name }),
      servings: data.recipe.servings,
      notes: data.recipe.notes,
      isFavorite: data.recipe.isFavorite,
      ingredients: data.items.map(({ ingredient }) => ({
        foodId: ingredient.foodId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
    };

    const result = await recipeRepository.create(input);
    setDuplicating(false);

    if (!result.ok) {
      setDuplicateError(true);
      return;
    }

    navigation.navigate('RecipeForm', { recipeId: result.value.id });
  }

  return { duplicating, duplicateError, handleDuplicate };
}
