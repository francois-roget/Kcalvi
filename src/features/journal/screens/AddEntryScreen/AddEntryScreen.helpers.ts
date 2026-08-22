import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

import { foodRepository, recipeRepository } from '@/data/repositories';
import type { Food, Recipe } from '@/domain/types';
import { useObservable } from '@/hooks/useObservable';
import type { RootTabParamList } from '@/navigation/types';

/**
 * The 2h mockup also shows a « Récents » chip; it is deliberately absent this sprint, since
 * recents (F07) are Sprint 4. « Aliments » is the default: adding a plain food is by far the
 * most common path, and it keeps the first render from mixing two result shapes.
 */
export type EntryFilterKey = 'favorites' | 'foods' | 'recipes';

export const ENTRY_FILTERS: EntryFilterKey[] = ['favorites', 'foods', 'recipes'];

export const DEFAULT_ENTRY_FILTER: EntryFilterKey = 'foods';

const EMPTY_FOODS: Food[] = [];
const EMPTY_RECIPES: Recipe[] = [];

/**
 * Observes the food and recipe searches for `debouncedQuery`, then applies the active chip
 * client-side -- same split as LibraryScreen (KCAL-104): the repositories expose no favorites
 * parameter, so favorites are filtered on the observed result.
 */
export function useAddEntryResults(debouncedQuery: string, filter: EntryFilterKey) {
  // Stable Observable reference per query (KCAL-103): `search()` builds a new observed query
  // on every call, so without this memo the screen resubscribes on each keystroke-driven
  // re-render, not just when the debounced query actually changes.
  const foodSearchObservable = useMemo(
    () => foodRepository.search(debouncedQuery),
    [debouncedQuery],
  );
  const foods = useObservable(foodSearchObservable, EMPTY_FOODS);

  const recipeSearchObservable = useMemo(
    () => recipeRepository.search(debouncedQuery),
    [debouncedQuery],
  );
  const recipes = useObservable(recipeSearchObservable, EMPTY_RECIPES);

  const filteredFoods = useMemo(() => {
    switch (filter) {
      case 'favorites':
        return foods.filter((food) => food.isFavorite);
      case 'recipes':
        return EMPTY_FOODS;
      case 'foods':
      default:
        return foods;
    }
  }, [foods, filter]);

  // « ★ Favoris » spans both kinds, like LibraryScreen's chip (KCAL-143).
  const filteredRecipes = useMemo(() => {
    switch (filter) {
      case 'favorites':
        return recipes.filter((recipe) => recipe.isFavorite);
      case 'foods':
        return EMPTY_RECIPES;
      case 'recipes':
      default:
        return recipes;
    }
  }, [recipes, filter]);

  return { filteredFoods, filteredRecipes };
}

/**
 * One row of the results list. A discriminated union rather than a shared shape with optional
 * fields: the two kinds carry different payloads and lead to different QuantitySheet modes
 * (KCAL-180), so making the kind explicit keeps the item renderer from guessing.
 */
export type EntryResult =
  | { kind: 'food'; id: string; food: Food }
  | { kind: 'recipe'; id: string; recipe: Recipe; caloriesPerPortion: number | undefined };

/**
 * Merges the two observed lists into the single FlatList the design shows, recipes first (they
 * are the fewer, higher-intent entries). `caloriesPerPortion` comes from the batched
 * `useRecipeCalories` map, resolved once for the whole list -- never recomputed per row inside
 * the FlatList renderer, which is the N+1 KCAL-158 removed from the library list.
 */
export function useEntryResults(
  filteredFoods: Food[],
  filteredRecipes: Recipe[],
  recipeCalories: Map<string, number>,
): EntryResult[] {
  return useMemo(
    () => [
      ...filteredRecipes.map<EntryResult>((recipe) => ({
        kind: 'recipe',
        id: recipe.id,
        recipe,
        caloriesPerPortion: recipeCalories.get(recipe.id),
      })),
      ...filteredFoods.map<EntryResult>((food) => ({ kind: 'food', id: food.id, food })),
    ],
    [filteredFoods, filteredRecipes, recipeCalories],
  );
}

/**
 * FoodFormScreen lives in the Library stack, while AddEntry is registered in the Today and
 * Journal stacks (KCAL-172), so « Créer » has to hop tabs through the parent tab navigator.
 * Typed via getParent's type argument: the stack's own `navigate` only knows its own routes.
 */
export function navigateToFoodForm(
  parent: BottomTabNavigationProp<RootTabParamList> | undefined,
  // KCAL-176: prefills the new food's name from the search term that matched nothing. Omitted
  // (or empty) for the header's plain « Créer », which opens a blank form.
  initialName?: string,
): void {
  parent?.navigate('LibraryTab', {
    screen: 'FoodForm',
    params: initialName ? { initialName } : undefined,
  });
}

// Turning `route.params.date` (a yyyy-MM-dd day key, KCAL-172) back into a Date belongs with
// the write path (KCAL-181), so it isn't here yet. Use date-fns `parseISO`, never
// `new Date('2026-08-21')`: the latter parses a date-only string as UTC and lands on the
// previous day for any device west of Greenwich.
