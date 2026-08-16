import type { RecipeIngredient } from '../types';
import { assertNonNegative, checkFoodDeletable } from './index';

describe('assertNonNegative (RM14)', () => {
  it('accepts zero and positive values', () => {
    expect(assertNonNegative(0, 'quantity')).toEqual({ ok: true, value: 0 });
    expect(assertNonNegative(42, 'quantity')).toEqual({ ok: true, value: 42 });
  });

  it('rejects negative values', () => {
    const result = assertNonNegative(-1, 'quantity');
    expect(result.ok).toBe(false);
  });
});

describe('checkFoodDeletable (RM15)', () => {
  it('is deletable when no recipe uses the food', () => {
    expect(checkFoodDeletable('food-1', [])).toEqual({ ok: true, value: undefined });
  });

  it('lists the impacted recipes when the food is in use', () => {
    const usages: RecipeIngredient[] = [
      { id: 'ri-1', recipeId: 'recipe-1', foodId: 'food-1', quantity: 100, unit: 'g' },
      { id: 'ri-2', recipeId: 'recipe-2', foodId: 'food-1', quantity: 50, unit: 'g' },
      { id: 'ri-3', recipeId: 'recipe-1', foodId: 'food-1', quantity: 20, unit: 'g' },
    ];

    const result = checkFoodDeletable('food-1', usages);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.recipeIds).toEqual(['recipe-1', 'recipe-2']);
    }
  });
});
