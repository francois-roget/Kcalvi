import { endOfWeek, startOfWeek } from 'date-fns';

import type {
  ActivityEntry,
  DiaryEntry,
  Food,
  NutritionValues,
  Recipe,
  RecipeIngredient,
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

/** RM04 */
export function calculateConsumedCalories(diaryEntries: DiaryEntry[]): number {
  return diaryEntries.reduce((total, entry) => total + entry.calories, 0);
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

/** RM12 — semaine lundi → dimanche */
export function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}
