import { endOfWeek, startOfWeek } from 'date-fns';

import type {
  ActivityEntry,
  ActivityLevel,
  DiaryEntry,
  Food,
  FoodPortion,
  NutritionValues,
  Recipe,
  RecipeIngredient,
  Sex,
} from '../types';

/** RM02 */
export function calculateProportionalNutrition(food: Food, quantity: number): NutritionValues {
  const ratio = quantity / food.referenceQuantity;
  return {
    calories: food.calories * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
}

/**
 * Converts a portion count (e.g. "2 pots") into the equivalent quantity expressed in the
 * owning food's reference unit (e.g. grams). `FoodPortion.quantity` is already stored in
 * those terms (KCAL-163a), so this is a plain multiply -- no per-portion unit conversion
 * happens here.
 *
 * This is the Sprint 2 invariant, still fully valid post-KCAL-163: `calculateProportionalNutrition`
 * has no unit awareness at all, so `RecipeIngredient.quantity` must already be
 * reference-unit-equivalent by the time it's stored. When the recipe ingredient picker lets
 * the user enter a count of portions instead of the reference unit directly, this conversion
 * must happen BEFORE the write, never at calculation time, or the ratio in
 * `calculateProportionalNutrition` silently mixes two different units.
 *
 * Replaces the Sprint 2 `convertServingsToReferenceQuantity`, which only supported a single
 * serving-size shortcut per food (`Food.servingQuantity`/`servingUnit`, now deprecated).
 */
export function convertPortionToReferenceQuantity(portion: FoodPortion, count: number): number {
  return count * portion.quantity;
}

/** RM03 */
export function calculateRecipeTotals(
  _recipe: Recipe,
  ingredients: { ingredient: RecipeIngredient; food: Food }[],
): NutritionValues {
  return ingredients.reduce<NutritionValues>(
    (totals, { ingredient, food }) => {
      const nutrition = calculateProportionalNutrition(food, ingredient.quantity);
      return {
        calories: totals.calories + nutrition.calories,
        protein: totals.protein + nutrition.protein,
        carbs: totals.carbs + nutrition.carbs,
        fat: totals.fat + nutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** F09 */
export function calculatePortionNutrition(
  recipeTotals: NutritionValues,
  servings: number,
): NutritionValues {
  return {
    calories: recipeTotals.calories / servings,
    protein: recipeTotals.protein / servings,
    carbs: recipeTotals.carbs / servings,
    fat: recipeTotals.fat / servings,
  };
}

/**
 * Scales an already-per-unit set of nutrition values by a count -- the exact inverse of
 * `calculatePortionNutrition`, and the function a recipe diary entry needs: per-portion
 * values (F09) x number of portions consumed.
 *
 * Deliberately its own function rather than reusing `calculatePortionNutrition` with a
 * computed `1 / factor` divisor. That trick reads as a division while performing a
 * multiplication, which is precisely the implicit-conversion class of bug documented at
 * length on `convertPortionToReferenceQuantity` in Sprint 2 -- and it would silently
 * produce Infinity at factor 0 instead of the zeroes callers expect.
 *
 * Unit-agnostic, like every other function here: `values` must already be expressed per
 * one of whatever `factor` counts.
 */
export function multiplyNutrition(values: NutritionValues, factor: number): NutritionValues {
  return {
    calories: values.calories * factor,
    protein: values.protein * factor,
    carbs: values.carbs * factor,
    fat: values.fat * factor,
  };
}

/**
 * Totals a day's diary entries across all four values (KCAL-184).
 *
 * Every entry already carries its own copied nutrition values (RM16), so this is a plain sum
 * with no per-entry recalculation. It exists because interactions.md forbids the UI from
 * adding up kcal or macros itself, and nothing in the domain aggregated the three macros --
 * only calories, via RM04.
 */
export function calculateConsumedNutrition(diaryEntries: DiaryEntry[]): NutritionValues {
  return diaryEntries.reduce<NutritionValues>(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** RM04 — the calories of `calculateConsumedNutrition`, kept as its own named rule. */
export function calculateConsumedCalories(diaryEntries: DiaryEntry[]): number {
  return calculateConsumedNutrition(diaryEntries).calories;
}

/** RM05 */
export function calculateBurnedCalories(activityEntries: ActivityEntry[]): number {
  return activityEntries.reduce((total, entry) => total + entry.caloriesBurned, 0);
}

/** RM06 */
export function calculateNetCalories(consumed: number, burned: number): number {
  return consumed - burned;
}

/** RM07 */
export function calculateRemainingCalories(goal: number, net: number): number {
  return goal - net;
}

/**
 * The feedback threshold of interactions.md: "dès que consommé net > objectif", the gauge, the
 * day total and the journal's status pill all switch to terracotta.
 *
 * A one-line predicate, but a shared one (KCAL-188): the same comparison was about to live in
 * ArcGauge and in JournalScreen's pill, and two copies of a threshold drift the moment one of
 * them becomes `>=`.
 */
export function isOverGoal(net: number, goal: number): boolean {
  return net > goal;
}

/** RM09 */
export function calculateWeeklyBudget(dailyGoal: number): number {
  return dailyGoal * 7;
}

/** RM10 */
export function calculateWeeklyNetConsumption(dailyNets: number[]): number {
  return dailyNets.reduce((total, net) => total + net, 0);
}

/** RM11 */
export function calculateRemainingWeeklyBudget(budget: number, consumed: number): number {
  return budget - consumed;
}

/** RM12 — week runs Monday → Sunday */
export function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Onboarding calculations (screens.md 2g: "Mifflin-St Jeor × activity factor − deficit").
 * The constants (7700 kcal/kg, 1.6 g/kg protein) aren't specified in the product
 * documents; they were decided with the user in the absence of a source.
 */

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very_active: 1.725,
};

const KCAL_PER_KG_BODY_MASS = 7700;
const MIN_DAILY_CALORIE_GOAL = 1200;
const PROTEIN_G_PER_KG = 1.6;
const FAT_CALORIE_SHARE = 0.25;

/** Mifflin-St Jeor */
export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateDailyDeficit(weeklyRateKg: number): number {
  return (weeklyRateKg * KCAL_PER_KG_BODY_MASS) / 7;
}

export function calculateDailyCalorieGoal(tdee: number, deficit: number): number {
  return Math.max(MIN_DAILY_CALORIE_GOAL, Math.round(tdee - deficit));
}

function roundToNearest5(value: number): number {
  return Math.round(value / 5) * 5;
}

export function calculateSuggestedMacros(
  dailyCalorieGoal: number,
  currentWeightKg: number,
): NutritionValues {
  const protein = roundToNearest5(PROTEIN_G_PER_KG * currentWeightKg);
  const fat = roundToNearest5((FAT_CALORIE_SHARE * dailyCalorieGoal) / 9);
  const carbs = roundToNearest5(Math.max(0, dailyCalorieGoal - protein * 4 - fat * 9) / 4);
  return { calories: dailyCalorieGoal, protein, carbs, fat };
}
