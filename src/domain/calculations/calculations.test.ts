import type { DiaryEntry, Food, FoodPortion } from '../types';
import {
  calculateBMR,
  calculateBurnedCalories,
  calculateConsumedCalories,
  calculateConsumedNutrition,
  calculateDailyCalorieGoal,
  calculateDailyDeficit,
  calculateNetCalories,
  calculatePortionNutrition,
  calculateProportionalNutrition,
  calculateRemainingCalories,
  calculateRemainingWeeklyBudget,
  calculateSuggestedMacros,
  calculateTDEE,
  calculateWeeklyBudget,
  calculateWeeklyNetConsumption,
  convertPortionToReferenceQuantity,
  getWeekBoundaries,
  multiplyNutrition,
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
  portions: [],
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

describe('convertPortionToReferenceQuantity', () => {
  it('converts a portion count into the equivalent reference-unit quantity', () => {
    const eggPortion: FoodPortion = {
      id: 'portion-1',
      foodId: food.id,
      label: '1 oeuf',
      quantity: 60,
      unit: 'unit',
      position: 0,
    };

    expect(convertPortionToReferenceQuantity(eggPortion, 2)).toBe(120);
  });

  it('returns 0 for a zero count', () => {
    const potPortion: FoodPortion = {
      id: 'portion-2',
      foodId: food.id,
      label: '1 pot',
      quantity: 150,
      unit: 'g',
      position: 0,
    };

    expect(convertPortionToReferenceQuantity(potPortion, 0)).toBe(0);
  });
});

describe('multiplyNutrition', () => {
  const perPortion = { calories: 250, protein: 12.5, carbs: 30, fat: 8.4 };

  it('scales per-portion values by the number of portions consumed', () => {
    expect(multiplyNutrition(perPortion, 2)).toEqual({
      calories: 500,
      protein: 25,
      carbs: 60,
      fat: 16.8,
    });
  });

  it('handles a fractional factor (half a portion)', () => {
    expect(multiplyNutrition(perPortion, 0.5)).toEqual({
      calories: 125,
      protein: 6.25,
      carbs: 15,
      fat: 4.2,
    });
  });

  it('returns zeroes at factor 0 rather than the Infinity a 1/factor divisor would give', () => {
    expect(multiplyNutrition(perPortion, 0)).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('is the inverse of calculatePortionNutrition', () => {
    const totals = { calories: 1000, protein: 50, carbs: 120, fat: 33.6 };
    expect(multiplyNutrition(calculatePortionNutrition(totals, 4), 4)).toEqual(totals);
  });
});

describe('calculateConsumedNutrition (KCAL-184)', () => {
  // Entries carry their own copied values (RM16), so aggregation is a plain sum.
  const entries = [
    { calories: 250, protein: 12.5, carbs: 30, fat: 8.4 },
    { calories: 150, protein: 7.5, carbs: 10, fat: 3.6 },
  ] as DiaryEntry[];

  it('sums all four values across the day', () => {
    expect(calculateConsumedNutrition(entries)).toEqual({
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 12,
    });
  });

  it('returns zeroes for an empty day rather than undefined', () => {
    expect(calculateConsumedNutrition([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it('agrees with calculateConsumedCalories (RM04), which is its calories', () => {
    expect(calculateConsumedCalories(entries)).toBe(calculateConsumedNutrition(entries).calories);
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
