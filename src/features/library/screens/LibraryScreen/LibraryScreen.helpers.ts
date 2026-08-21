import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { database } from '@/data/database';
import { foodRepository, recipeRepository } from '@/data/repositories';
import { getRecipesCalories } from '@/data/repositories/getRecipesCalories';
import type { Food, Recipe, RecipeIngredient, Result } from '@/domain/types';
import { checkFoodDeletable } from '@/domain/validation';
import { useObservable } from '@/hooks/useObservable';
import type { LibraryScreenProps } from '@/navigation/types';

// Kept minimal on purpose: the real i18next `TFunction` type is generic over namespaces/keys,
// which isn't needed here -- these hooks only ever call `t(key, options)` for their own error
// strings.
export type TFunction = (key: string, options?: Record<string, unknown>) => string;

export type FilterKey = 'all' | 'favorites' | 'foods' | 'recipes';

export const FILTERS: FilterKey[] = ['all', 'favorites', 'foods', 'recipes'];

const EMPTY_FOODS: Food[] = [];
const EMPTY_RECIPES: Recipe[] = [];
const EMPTY_USAGES: RecipeIngredient[] = [];

export type FoodInUseError = { code: 'FOOD_IN_USE'; message: string; recipeIds: string[] };
export type Deletability = Result<void, FoodInUseError> | null;

/**
 * Observes the food/recipe search results for `debouncedQuery` and derives every list-shaped
 * piece of state the screen needs from them: the client-side quick-filter (KCAL-104/143), the
 * empty-library state (KCAL-108), and the section-visibility/global-no-results rules (KCAL-157).
 */
export function useLibraryLists(debouncedQuery: string, selectedFilter: FilterKey) {
  // Stable Observable reference per query (KCAL-103): `foodRepository.search`
  // creates a new observed query each call, so this is memoized on the
  // debounced query alone to avoid resubscribing on unrelated re-renders.
  const searchObservable = useMemo(() => foodRepository.search(debouncedQuery), [debouncedQuery]);
  const foods = useObservable(searchObservable, EMPTY_FOODS);

  // KCAL-142 — same stable-Observable pattern as foods, sharing the single
  // search field (RecipeRepository.search is name-based, like foodRepository.search).
  const recipeSearchObservable = useMemo(
    () => recipeRepository.search(debouncedQuery),
    [debouncedQuery],
  );
  const recipes = useObservable(recipeSearchObservable, EMPTY_RECIPES);

  // KCAL-108: the true empty-library state only applies to a fresh library
  // (no search in progress), not to "no results for this search".
  const isLibraryEmpty = foods.length === 0 && recipes.length === 0 && debouncedQuery.trim() === '';

  // KCAL-104 — client-side filtering of the observed result (decided in
  // KCAL-101: no repository-level favorites param).
  const filteredFoods = useMemo(() => {
    switch (selectedFilter) {
      case 'favorites':
        return foods.filter((food) => food.isFavorite);
      case 'recipes':
        return [];
      case 'foods':
      case 'all':
      default:
        return foods;
    }
  }, [foods, selectedFilter]);

  // KCAL-143 — mirrors `filteredFoods`: the "Aliments" chip hides recipes,
  // the "Favoris" chip applies to recipes too.
  const filteredRecipes = useMemo(() => {
    switch (selectedFilter) {
      case 'favorites':
        return recipes.filter((recipe) => recipe.isFavorite);
      case 'foods':
        return [];
      case 'recipes':
      case 'all':
      default:
        return recipes;
    }
  }, [recipes, selectedFilter]);

  // KCAL-157 — the active quick filter drives whether a whole section exists in the
  // render tree, not just whether its content is empty: filtering to "Aliments" means
  // the Recettes section (and its "Aucun résultat") shouldn't be there at all.
  const showRecipesSection = selectedFilter !== 'foods';
  const showFoodsSection = selectedFilter !== 'recipes';

  // KCAL-157 — when every currently visible section is empty during an active search,
  // show one message mentioning the query instead of two stacked "Aucun résultat".
  // Gated on `isSearching` (rather than firing whenever a filter like ★ Favoris simply
  // has nothing to show without any search in progress) because the global message
  // names the search term -- there'd be nothing meaningful to name otherwise.
  const isSearching = debouncedQuery.trim() !== '';
  const showGlobalNoResults =
    isSearching &&
    (!showRecipesSection || filteredRecipes.length === 0) &&
    (!showFoodsSection || filteredFoods.length === 0);

  // KCAL-105/143 — HeroCard counts reflect the current (searched) result set, and are
  // deliberately NOT filtered by `selectedFilter` (KCAL-157): the hero always reflects
  // the real library content, independent of the active quick filter chip.
  const counts = useMemo(
    () => ({
      foods: foods.length,
      recipes: recipes.length,
      favorites: foods.filter((food) => food.isFavorite).length,
    }),
    [foods, recipes],
  );

  return {
    foods,
    recipes,
    filteredFoods,
    filteredRecipes,
    counts,
    isLibraryEmpty,
    showRecipesSection,
    showFoodsSection,
    showGlobalNoResults,
  };
}

/**
 * KCAL-158 — per-portion kcal for the currently observed recipes, computed in 2 batched
 * queries total via `getRecipesCalories` (not 2 per recipe -- see that function's doc comment
 * for why). Refreshed both when `recipes` changes and on focus: `recipeRepository.search()`'s
 * observable only watches the `recipes` table, not joined foods, so editing a food's calories
 * doesn't re-trigger the effect and the recipe cards would show stale kcal without the
 * focus-triggered refresh covering the real navigation path (edit a food, come back here).
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

/**
 * KCAL-119/145/153 — owns the whole food-deletion flow: which food (if any) is pending
 * deletion, whether it's actually deletable (RM15, via `checkFoodDeletable` against its real
 * `RecipeIngredient[]` usages), and the confirm/archive/cancel handlers. A failed
 * delete/archive `Result` keeps the dialog open with `errorMessage` set instead of closing
 * silently (KCAL-153) -- the root cause of the old "Supprimer quand même" no-op was a handler
 * discarding that `Result`.
 */
export function useFoodDeleteFlow(t: TFunction) {
  const [foodPendingDeletion, setFoodPendingDeletion] = useState<Food | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // KCAL-145 — `findUsagesByFoodId` is async, so the deletability check can no
  // longer be a pure useMemo: fetch usages when the pending-deletion food
  // changes, then derive `deletability` from that state. `cancelled` guards
  // against setting state from a stale request if the food changes (or the
  // sheet is dismissed) before the query resolves.
  const [foodUsages, setFoodUsages] = useState<RecipeIngredient[]>(EMPTY_USAGES);

  useEffect(() => {
    // No reset-to-empty branch needed: `deletability` below already returns
    // `null` whenever `foodPendingDeletion` is null, regardless of stale
    // `foodUsages` from a previous dialog — avoids a synchronous setState
    // in the effect body for the "no pending deletion" case.
    if (!foodPendingDeletion) return;

    let cancelled = false;
    recipeRepository.findUsagesByFoodId(foodPendingDeletion.id).then((usages) => {
      if (!cancelled) setFoodUsages(usages);
    });

    return () => {
      cancelled = true;
    };
  }, [foodPendingDeletion]);

  const deletability = useMemo<Deletability>(
    () => (foodPendingDeletion ? checkFoodDeletable(foodPendingDeletion.id, foodUsages) : null),
    [foodPendingDeletion, foodUsages],
  );

  function openDeleteDialog(food: Food) {
    setErrorMessage(null);
    setFoodPendingDeletion(food);
  }

  function cancelDelete() {
    setFoodPendingDeletion(null);
    setErrorMessage(null);
  }

  async function confirmDelete() {
    if (!foodPendingDeletion) return;
    const result = await foodRepository.delete(foodPendingDeletion.id);
    if (!result.ok) {
      setErrorMessage(t('library.deleteDialog.deleteError'));
      return;
    }
    setErrorMessage(null);
    setFoodPendingDeletion(null);
  }

  async function archiveInstead() {
    if (!foodPendingDeletion) return;
    const result = await foodRepository.archive(foodPendingDeletion.id);
    if (!result.ok) {
      setErrorMessage(t('library.deleteDialog.archiveError'));
      return;
    }
    setErrorMessage(null);
    setFoodPendingDeletion(null);
  }

  return {
    foodPendingDeletion,
    deletability,
    errorMessage,
    openDeleteDialog,
    cancelDelete,
    confirmDelete,
    archiveInstead,
  };
}

/**
 * KCAL-162 — mirrors `useFoodDeleteFlow` for recipe archiving: same "never close silently on
 * failure" requirement as KCAL-153.
 */
export function useRecipeArchiveFlow(t: TFunction) {
  const [recipePendingArchive, setRecipePendingArchive] = useState<Recipe | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openArchiveDialog(recipe: Recipe) {
    setErrorMessage(null);
    setRecipePendingArchive(recipe);
  }

  function cancelArchive() {
    setRecipePendingArchive(null);
    setErrorMessage(null);
  }

  async function confirmArchive() {
    if (!recipePendingArchive) return;
    const result = await recipeRepository.archive(recipePendingArchive.id);
    if (!result.ok) {
      setErrorMessage(t('library.archiveRecipeDialog.archiveError'));
      return;
    }
    setErrorMessage(null);
    setRecipePendingArchive(null);
  }

  return { recipePendingArchive, errorMessage, openArchiveDialog, cancelArchive, confirmArchive };
}

/** Navigation + inline favorite-toggle handlers shared by the orchestrator's JSX. */
export function useLibraryActions(navigation: LibraryScreenProps['navigation']) {
  function handleCreatePress() {
    navigation.navigate('FoodForm');
  }

  function handleCreateRecipePress() {
    navigation.navigate('RecipeForm');
  }

  function handleRecipePress(recipeId: string) {
    navigation.navigate('RecipeDetail', { recipeId });
  }

  function handleFoodPress(foodId: string) {
    navigation.navigate('FoodForm', { foodId });
  }

  async function handleToggleFavorite(food: Food) {
    await foodRepository.update(food.id, { isFavorite: !food.isFavorite });
  }

  async function handleToggleRecipeFavorite(recipe: Recipe) {
    await recipeRepository.update(recipe.id, { isFavorite: !recipe.isFavorite });
  }

  return {
    handleCreatePress,
    handleCreateRecipePress,
    handleRecipePress,
    handleFoodPress,
    handleToggleFavorite,
    handleToggleRecipeFavorite,
  };
}

export type LibraryActions = ReturnType<typeof useLibraryActions>;
