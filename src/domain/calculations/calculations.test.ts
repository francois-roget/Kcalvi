import type { Food } from '../types';
import {
  calculateBMR,
  calculateBurnedCalories,
  calculateConsumedCalories,
  calculateDailyCalorieGoal,
  calculateDailyDeficit,
  calculateNetCalories,
  calculateProportionalNutrition,
  calculateRemainingCalories,
  calculateRemainingWeeklyBudget,
  calculateSuggestedMacros,
  calculateTDEE,
  calculateWeeklyBudget,
  calculateWeeklyNetConsumption,
  convertServingsToReferenceQuantity,
  getWeekBoundaries,
} from './index';

const food: Food = {
  id: 'food-1',
  name: 'Riz',
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  referenceQuantity: 100,
  referenceUnit: 'g',
  isFavorite: false,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('calculateProportionalNutrition (RM02)', () => {
  it('scales nutrition linearly with quantity', () => {
    expect(calculateProportionalNutrition(food, 200)).toEqual({
      calories: 260,
      protein: 5.4,
      carbs: 56,
      fat: 0.6,
    });
  });

  it('returns zero nutrition for a zero quantity', () => {
    expect(calculateProportionalNutrition(food, 0)).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe('convertServingsToReferenceQuantity', () => {
  it('converts a serving count into the equivalent reference-unit quantity', () => {
    const eggFood: Food = { ...food, servingQuantity: 60, servingUnit: 'oeuf' };

    expect(convertServingsToReferenceQuantity(eggFood, 2)).toBe(120);
  });

  it('falls back to 0 (via the `?? 0` guard) when servingQuantity is undefined', () => {
    // `food` has no servingQuantity. The function itself falls back to 0 rather than
    // throwing; per its doc comment, callers are responsible for only invoking it once
    // `food.servingQuantity` is known to be defined -- this test documents the fallback
    // as implemented, not as a recommended call pattern.
    expect(food.servingQuantity).toBeUndefined();
    expect(convertServingsToReferenceQuantity(food, 3)).toBe(0);
  });
});

describe('calorie balance (RM04-RM07)', () => {
  it('sums consumed and burned calories', () => {
    expect(calculateConsumedCalories([{ calories: 500 } as any, { calories: 300 } as any])).toBe(
      800,
    );
    expect(calculateBurnedCalories([{ caloriesBurned: 200 } as any])).toBe(200);
  });

  it('derives net and remaining calories', () => {
    const net = calculateNetCalories(800, 200);
    expect(net).toBe(600);
    expect(calculateRemainingCalories(2000, net)).toBe(1400);
  });
});

describe('weekly budget (RM09-RM11)', () => {
  it('computes a weekly budget from the daily goal', () => {
    expect(calculateWeeklyBudget(2000)).toBe(14000);
  });

  it('sums daily nets and derives the remaining weekly budget', () => {
    const weeklyNet = calculateWeeklyNetConsumption([1800, 2200, 1900]);
    expect(weeklyNet).toBe(5900);
    expect(calculateRemainingWeeklyBudget(14000, weeklyNet)).toBe(8100);
  });
});

describe('getWeekBoundaries (RM12)', () => {
  it('resolves Monday to Sunday for a mid-week date', () => {
    const { start, end } = getWeekBoundaries(new Date('2026-08-19T12:00:00'));
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
  });
});

describe('calculateBMR (onboarding, Mifflin-St Jeor)', () => {
  it('adds the male offset', () => {
    expect(calculateBMR('male', 80, 180, 30)).toBe(1780);
  });

  it('subtracts the female offset', () => {
    expect(calculateBMR('female', 65, 165, 28)).toBe(1380.25);
  });
});

describe('calculateTDEE (onboarding)', () => {
  it('applies the activity multiplier to the BMR', () => {
    expect(calculateTDEE(1780, 'light')).toBe(2447.5);
  });
});

describe('calculateDailyDeficit (onboarding, 7700 kcal/kg)', () => {
  it('converts a weekly rate into a daily deficit', () => {
    expect(calculateDailyDeficit(0.25)).toBe(275);
    expect(calculateDailyDeficit(0.5)).toBe(550);
    expect(calculateDailyDeficit(0.75)).toBe(825);
  });
});

describe('calculateDailyCalorieGoal (onboarding)', () => {
  it('subtracts the deficit from the TDEE', () => {
    expect(calculateDailyCalorieGoal(2447.5, 550)).toBe(1898);
  });

  it('clamps to the 1200 kcal safety floor', () => {
    expect(calculateDailyCalorieGoal(1000, 500)).toBe(1200);
  });
});

describe('calculateSuggestedMacros (onboarding, protein g/kg)', () => {
  it('derives protein/fat/carbs from the calorie goal and body weight', () => {
    expect(calculateSuggestedMacros(1898, 80)).toEqual({
      calories: 1898,
      protein: 130,
      carbs: 220,
      fat: 55,
    });
  });
});
