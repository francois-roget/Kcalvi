import type { Food } from '../types';
import {
  calculateBurnedCalories,
  calculateConsumedCalories,
  calculateNetCalories,
  calculateProportionalNutrition,
  calculateRemainingCalories,
  calculateRemainingWeeklyBudget,
  calculateWeeklyBudget,
  calculateWeeklyNetConsumption,
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
