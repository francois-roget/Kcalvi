import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import { database } from '@/data/database';
import { getRecipesCalories } from '@/data/repositories/getRecipesCalories';
import type { Recipe } from '@/domain/types';

/**
 * KCAL-158 — per-portion kcal for a list of recipes, computed in 2 batched queries total via
 * `getRecipesCalories` (not 2 per recipe -- see that function's doc comment for why).
 * Refreshed both when `recipes` changes and on focus: `recipeRepository.search()`'s observable
 * only watches the `recipes` table, not joined foods, so editing a food's calories doesn't
 * re-trigger the effect and the recipe rows would show stale kcal without the focus-triggered
 * refresh covering the real navigation path (edit a food, come back here).
 *
 * KCAL-175: moved out of LibraryScreen.helpers so AddEntryScreen's result list shares it
 * rather than copying the focus-refresh subtlety.
 */
export function useRecipeCalories(recipes: Recipe[]): Map<string, number> {
  const [recipeCalories, setRecipeCalories] = useState<Map<string, number>>(new Map());

  const refreshRecipeCalories = useCallback((recipeList: Recipe[]) => {
    let cancelled = false;
    getRecipesCalories(database, recipeList).then((calories) => {
      if (!cancelled) setRecipeCalories(calories);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refreshRecipeCalories(recipes), [recipes, refreshRecipeCalories]);

  useFocusEffect(
    useCallback(() => refreshRecipeCalories(recipes), [recipes, refreshRecipeCalories]),
  );

  return recipeCalories;
}
