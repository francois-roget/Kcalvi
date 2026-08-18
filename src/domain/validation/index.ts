import type { RecipeIngredient } from '../types';
import { err, ok, type Result } from '../types/result';

/**
 * RM14. `message` is a technical fallback only (logs, tests) — callers must build the
 * user-facing text from `error.code` via i18n, since `domain/` stays framework- and
 * locale-independent (TECHNICAL_SPECS.MD §2.2).
 */
export function assertNonNegative(value: number, field: string): Result<number> {
  if (value < 0) {
    return err({ code: 'NEGATIVE_VALUE', message: `${field} must not be negative` });
  }
  return ok(value);
}

const AGE_RANGE = { min: 15, max: 100 };
const HEIGHT_CM_RANGE = { min: 100, max: 250 };
const WEIGHT_KG_RANGE = { min: 30, max: 300 };

function assertInRange(
  value: number,
  field: string,
  range: { min: number; max: number },
): Result<number> {
  if (Number.isNaN(value)) {
    return err({ code: 'INVALID_NUMBER', message: `${field} is not a valid number` });
  }
  if (value < range.min || value > range.max) {
    return err({
      code: 'OUT_OF_RANGE',
      message: `${field} must be between ${range.min} and ${range.max}`,
      min: range.min,
      max: range.max,
    });
  }
  return ok(value);
}

/** Onboarding profile input bounds — not specified in the product documents. */
export function assertValidAge(age: number): Result<number> {
  return assertInRange(age, 'Age', AGE_RANGE);
}

export function assertValidHeight(heightCm: number): Result<number> {
  return assertInRange(heightCm, 'Height', HEIGHT_CM_RANGE);
}

export function assertValidWeight(weightKg: number): Result<number> {
  return assertInRange(weightKg, 'Weight', WEIGHT_KG_RANGE);
}

/** RM15 — returns the impacted recipes if the food is in use */
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
      message: 'This food is used by one or more recipes',
      recipeIds: impactedRecipeIds,
    });
  }

  return ok(undefined);
}
