import type { Database } from '@nozbe/watermelondb';

import type { DomainError, Food, Recipe, RecipeIngredient, Result } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import FoodModel from '../database/models/Food';
import RecipeModel from '../database/models/Recipe';
import { toDomainRecipe, toDomainRecipeIngredient } from './LocalRecipeRepository';
import { toDomainFood } from './mapping';

/**
 * Joins a Recipe with its ingredients and each ingredient's Food record, producing the
 * exact `{ ingredient, food }[]` shape `calculateRecipeTotals` (domain/calculations) expects
 * as its second argument. Used by RecipeFormScreen's edit mode (KCAL-137) and
 * RecipeDetailScreen (KCAL-138/139) in a later phase.
 */
export async function getRecipeWithIngredients(
  database: Database,
  recipeId: string,
): Promise<
  Result<{ recipe: Recipe; items: { ingredient: RecipeIngredient; food: Food }[] }, DomainError>
> {
  let recipeRecord: RecipeModel;
  try {
    recipeRecord = await database.get<RecipeModel>('recipes').find(recipeId);
  } catch {
    return err({ code: 'RECIPE_NOT_FOUND', message: `Recipe ${recipeId} not found` });
  }

  const ingredientRecords = await recipeRecord.ingredients.fetch();

  try {
    const items = await Promise.all(
      ingredientRecords.map(async (ingredientRecord) => {
        const foodRecord = await database.get<FoodModel>('foods').find(ingredientRecord.foodId);
        return {
          ingredient: toDomainRecipeIngredient(ingredientRecord),
          food: toDomainFood(foodRecord),
        };
      }),
    );

    return ok({ recipe: toDomainRecipe(recipeRecord), items });
  } catch {
    // A referenced Food is missing -- shouldn't normally happen since FoodRepository.delete()
    // blocks deleting a food that's still in use (RM15/checkFoodDeletable), but guarded here
    // so this stays a Result instead of an unhandled rejection.
    return err({
      code: 'RECIPE_INGREDIENT_FOOD_NOT_FOUND',
      message: `A food referenced by recipe ${recipeId} could not be found`,
    });
  }
}
