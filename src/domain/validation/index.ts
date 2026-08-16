import type { RecipeIngredient } from '../types';
import { err, ok, type Result } from '../types/result';

/** RM14 */
export function assertNonNegative(value: number, field: string): Result<number> {
  if (value < 0) {
    return err({ code: 'NEGATIVE_VALUE', message: `${field} ne peut pas être négatif` });
  }
  return ok(value);
}

/** RM15 — retourne les recettes impactées si l'aliment est utilisé */
export function checkFoodDeletable(
  foodId: string,
  usages: RecipeIngredient[],
): Result<void, { code: 'FOOD_IN_USE'; message: string; recipeIds: string[] }> {
  const impactedRecipeIds = [
    ...new Set(usages.filter((usage) => usage.foodId === foodId).map((usage) => usage.recipeId)),
  ];

  if (impactedRecipeIds.length > 0) {
    return err({
      code: 'FOOD_IN_USE',
      message: 'Cet aliment est utilisé dans une ou plusieurs recettes',
      recipeIds: impactedRecipeIds,
    });
  }

  return ok(undefined);
}
