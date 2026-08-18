import type { RecipeIngredient } from '../types';
import {
  assertNonNegative,
  assertValidAge,
  assertValidHeight,
  assertValidWeight,
  checkFoodDeletable,
} from './index';

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

describe('assertValidAge / assertValidHeight / assertValidWeight (onboarding)', () => {
  it('rejects NaN instead of silently accepting it', () => {
    // Reproduces the observed bug: on a decimal-pad keyboard in fr locale, the
    // decimal key types a comma ("82,5"), which Number() doesn't parse ("82,5" -> NaN).
    // Since < / > comparisons are always false with NaN, assertInRange let the
    // value through, and NaN propagated up to the Goal screen (BMR/TDEE/macros).
    const weightCheck = assertValidWeight(Number('82,5'));
    expect(weightCheck.ok).toBe(false);

    const heightCheck = assertValidHeight(Number('1,78'));
    expect(heightCheck.ok).toBe(false);

    // Number('') === 0 (not NaN): already rejected normally by the existing min bound.
    expect(assertValidAge(Number('')).ok).toBe(false);
  });

  it('accepts valid values within range', () => {
    expect(assertValidWeight(82).ok).toBe(true);
    expect(assertValidHeight(178).ok).toBe(true);
    expect(assertValidAge(30).ok).toBe(true);
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
