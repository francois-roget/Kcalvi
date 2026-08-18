import { endOfWeek, startOfWeek } from 'date-fns';

import type {
  ActivityEntry,
  ActivityLevel,
  DiaryEntry,
  Food,
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
