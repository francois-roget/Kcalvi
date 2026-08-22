import type { DiaryEntry } from '@/domain/types';

import { groupEntriesByMeal } from './useEntriesByMeal';

function entry(mealType: DiaryEntry['mealType'], label: string): DiaryEntry {
  return { mealType, label } as DiaryEntry;
}

describe('groupEntriesByMeal (KCAL-185)', () => {
  it('splits one observed day into a list per meal, keeping insertion order', () => {
    const byMeal = groupEntriesByMeal([
      entry('LUNCH', 'Riz'),
      entry('BREAKFAST', 'Café'),
      entry('LUNCH', 'Poulet'),
    ]);

    expect(byMeal.BREAKFAST.map((item) => item.label)).toEqual(['Café']);
    expect(byMeal.LUNCH.map((item) => item.label)).toEqual(['Riz', 'Poulet']);
    expect(byMeal.SNACK).toEqual([]);
    expect(byMeal.DINNER).toEqual([]);
  });

  it('gives every meal a list, so the four cards always render (2s empty day)', () => {
    // A missing key would hand MealCard an `undefined` to read `.length` off.
    expect(groupEntriesByMeal([])).toEqual({
      BREAKFAST: [],
      LUNCH: [],
      SNACK: [],
      DINNER: [],
    });
  });
});
