import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';

import { calculatePortionNutrition, calculateRecipeTotals } from '@/domain/calculations';
import type { Food, Recipe, RecipeIngredient } from '@/domain/types';

import FoodModel from '../database/models/Food';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import { toDomainRecipeIngredient } from './LocalRecipeRepository';
import { toDomainFood } from './mapping';

/**
 * Per-portion calories for a batch of recipes, in 2 queries total (not 2 per recipe).
 * Used by the library list (KCAL-158), where showing kcal per recipe card would otherwise
 * mean one ingredients query + one food query per ingredient, per recipe, per keystroke of
 * the debounced search -- ~300 requests for 50 recipes of 5 ingredients each. Reuses
 * `calculateRecipeTotals`/`calculatePortionNutrition` (domain/calculations) as-is; this
 * function only handles the batched fetch + in-memory grouping.
 */
export async function getRecipesCalories(
  database: Database,
  recipes: Recipe[],
): Promise<Map<string, number>> {
  const calories = new Map<string, number>();
  if (recipes.length === 0) return calories;

  const recipeIds = recipes.map((recipe) => recipe.id);

  // Query 1: every RecipeIngredient row for the whole batch of recipes at once.
  const ingredientRecords = await database
    .get<RecipeIngredientModel>('recipe_ingredients')
    .query(Q.where('recipe_id', Q.oneOf(recipeIds)))
    .fetch();
  const ingredients = ingredientRecords.map(toDomainRecipeIngredient);

  const uniqueFoodIds = [...new Set(ingredients.map((ingredient) => ingredient.foodId))];

  const foodsById = new Map<string, Food>();
  if (uniqueFoodIds.length > 0) {
    // Query 2: every Food referenced by any of those ingredients, in a single batch.
    const foodRecords = await database
      .get<FoodModel>('foods')
      .query(Q.where('id', Q.oneOf(uniqueFoodIds)))
      .fetch();
    for (const record of foodRecords) {
      foodsById.set(record.id, toDomainFood(record));
    }
  }

  const ingredientsByRecipeId = new Map<string, RecipeIngredient[]>();
  for (const ingredient of ingredients) {
    const list = ingredientsByRecipeId.get(ingredient.recipeId);
    if (list) {
      list.push(ingredient);
    } else {
      ingredientsByRecipeId.set(ingredient.recipeId, [ingredient]);
    }
  }

  for (const recipe of recipes) {
    const recipeIngredients = ingredientsByRecipeId.get(recipe.id) ?? [];
    // A food referenced by an ingredient could in principle be missing from `foodsById`
    // (e.g. a race with a concurrent delete); skip it rather than throwing, since this
    // batch helper backs a list display, not a page that owns a single recipe's integrity.
    const items = recipeIngredients.flatMap((ingredient) => {
      const food = foodsById.get(ingredient.foodId);
      return food ? [{ ingredient, food }] : [];
    });

    const totals = calculateRecipeTotals(recipe, items);
    const portion = calculatePortionNutrition(totals, recipe.servings);
    calories.set(recipe.id, portion.calories);
  }

  return calories;
}
