import type { Database } from '@nozbe/watermelondb';
import type { Observable } from '@nozbe/watermelondb/utils/rx';

import { createTestDatabase } from '../database/createTestDatabase';
import DiaryEntryModel from '../database/models/DiaryEntry';
import type { CreateDiaryEntryInput } from './DiaryEntryRepository';
import { LocalDiaryEntryRepository } from './LocalDiaryEntryRepository';

function collectEmissions<T>(observable: Observable<T>, count: number): Promise<T[]> {
  return new Promise((resolve) => {
    const values: T[] = [];
    // Declared before `.subscribe()` returns: WatermelonDB's Query.observe() emits its first
    // value synchronously, so the callback can run before the call itself returns.
    let subscription: { unsubscribe: () => void } | undefined;
    subscription = observable.subscribe((value) => {
      values.push(value);
      if (values.length === count) {
        subscription?.unsubscribe();
        resolve(values);
      }
    });
  });
}

const AUGUST_21 = new Date(2026, 7, 21, 14, 30);

const FOOD_ENTRY: CreateDiaryEntryInput = {
  date: AUGUST_21,
  mealType: 'LUNCH',
  source: { kind: 'food', foodId: 'food-rice', portionId: 'portion-bowl' },
  quantity: 150,
  unit: 'g',
  calories: 195,
  protein: 4.05,
  carbs: 42,
  fat: 0.45,
  label: 'Riz',
};

const RECIPE_ENTRY: CreateDiaryEntryInput = {
  date: AUGUST_21,
  mealType: 'DINNER',
  source: { kind: 'recipe', recipeId: 'recipe-soup' },
  quantity: 2,
  unit: 'portion',
  calories: 400,
  protein: 20,
  carbs: 30,
  fat: 12,
  label: 'Soupe de potiron',
};

async function observeOnce(repository: LocalDiaryEntryRepository, date: Date) {
  // Subscribed after the writes have settled, so the first emission already reflects the
  // current DB state (Query.observe() emits synchronously on subscribe).
  const [result] = await collectEmissions(repository.observeByDate(date), 1);
  return result;
}

describe('LocalDiaryEntryRepository (real SQLite via better-sqlite3)', () => {
  let database: Database;
  let repository: LocalDiaryEntryRepository;

  beforeEach(() => {
    database = createTestDatabase();
    repository = new LocalDiaryEntryRepository(database);
  });

  describe('create', () => {
    it('writes a food entry with its copied values and its portion traceability', async () => {
      const result = await repository.create(FOOD_ENTRY);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.label).toBe('Riz');
      expect(result.value.mealType).toBe('LUNCH');
      expect(result.value.foodId).toBe('food-rice');
      expect(result.value.portionId).toBe('portion-bowl');
      expect(result.value.quantity).toBe(150);
      expect(result.value.unit).toBe('g');
      expect(result.value.calories).toBe(195);
      // Normalized to local midnight on write (KCAL-169), not the 14:30 that was passed.
      expect(result.value.date).toEqual(new Date(2026, 7, 21));
    });

    it('writes a recipe entry counted in portions', async () => {
      const result = await repository.create(RECIPE_ENTRY);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.recipeId).toBe('recipe-soup');
      expect(result.value.unit).toBe('portion');
      expect(result.value.quantity).toBe(2);
    });

    it('reads unset optional columns back as undefined, never null (KCAL-152)', async () => {
      const result = await repository.create({
        ...FOOD_ENTRY,
        source: { kind: 'food', foodId: 'food-rice' },
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // A raw null would render as the string "null" in the UI, which is the bug KCAL-152 fixed.
      expect(result.value.portionId).toBeUndefined();
      expect(result.value.recipeId).toBeUndefined();
      expect(result.value.portionId).not.toBeNull();
      expect(result.value.recipeId).not.toBeNull();
    });

    it('rejects a negative quantity (RM14) without writing anything', async () => {
      const result = await repository.create({ ...FOOD_ENTRY, quantity: -1 });

      expect(result.ok).toBe(false);
      const rows = await database.get<DiaryEntryModel>('diary_entries').query().fetch();
      expect(rows).toHaveLength(0);
    });
  });

  describe('observeByDate', () => {
    it('returns the day’s entries whatever time of day they were written', async () => {
      await repository.create({ ...FOOD_ENTRY, date: new Date(2026, 7, 21, 0, 1) });
      await repository.create({
        ...RECIPE_ENTRY,
        date: new Date(2026, 7, 21, 23, 59),
        label: 'Fin de journée',
      });

      const entries = await observeOnce(repository, AUGUST_21);

      expect(entries.map((entry) => entry.label).sort()).toEqual(['Fin de journée', 'Riz']);
    });

    it('excludes the neighbouring days, including their midnight edges', async () => {
      await repository.create({ ...FOOD_ENTRY, date: new Date(2026, 7, 20, 23, 59) });
      await repository.create({ ...FOOD_ENTRY, date: new Date(2026, 7, 22, 0, 1) });
      await repository.create({ ...FOOD_ENTRY, label: 'Le bon jour' });

      const entries = await observeOnce(repository, AUGUST_21);

      expect(entries).toHaveLength(1);
      expect(entries[0].label).toBe('Le bon jour');
    });

    it('surfaces a row written without normalization, rather than hiding it (KCAL-169)', async () => {
      // The range query exists for exactly this: a future non-normalized write must show up in
      // the journal instead of vanishing from it.
      await database.write(() =>
        database.get<DiaryEntryModel>('diary_entries').create((row) => {
          row.date = new Date(2026, 7, 21, 18, 45);
          row.mealType = 'SNACK';
          row.quantity = 1;
          row.unit = 'unit';
          row.calories = 80;
          row.protein = 1;
          row.carbs = 10;
          row.fat = 3;
          row.label = 'Écrit hors du repository';
        }),
      );

      const entries = await observeOnce(repository, AUGUST_21);

      expect(entries.map((entry) => entry.label)).toEqual(['Écrit hors du repository']);
    });
  });

  describe('update', () => {
    it('changes the quantity and its copied values', async () => {
      const created = await repository.create(FOOD_ENTRY);
      if (!created.ok) throw new Error('setup failed');

      const updated = await repository.update(created.value.id, { quantity: 300, calories: 390 });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.quantity).toBe(300);
      expect(updated.value.calories).toBe(390);
      expect(updated.value.label).toBe('Riz');
    });

    it('moves an entry to another meal without moving its day', async () => {
      const created = await repository.create(FOOD_ENTRY);
      if (!created.ok) throw new Error('setup failed');

      const updated = await repository.update(created.value.id, { mealType: 'SNACK' });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.mealType).toBe('SNACK');
      expect(updated.value.date).toEqual(new Date(2026, 7, 21));
    });

    it('rejects a negative quantity (RM14) and leaves the entry untouched', async () => {
      const created = await repository.create(FOOD_ENTRY);
      if (!created.ok) throw new Error('setup failed');

      const updated = await repository.update(created.value.id, { quantity: -5 });

      expect(updated.ok).toBe(false);
      const reread = await repository.findById(created.value.id);
      if (!reread.ok) throw new Error('entry disappeared');
      expect(reread.value.quantity).toBe(150);
    });

    it('returns an error Result for an unknown id rather than throwing', async () => {
      const updated = await repository.update('does-not-exist', { quantity: 10 });

      expect(updated.ok).toBe(false);
      if (updated.ok) return;
      expect(updated.error.code).toBe('DIARY_ENTRY_NOT_FOUND');
    });
  });

  describe('delete', () => {
    it('removes the entry from the day', async () => {
      const created = await repository.create(FOOD_ENTRY);
      if (!created.ok) throw new Error('setup failed');

      const deleted = await repository.delete(created.value.id);

      expect(deleted.ok).toBe(true);
      expect(await observeOnce(repository, AUGUST_21)).toEqual([]);
    });

    it('returns an error Result for an unknown id rather than throwing', async () => {
      const deleted = await repository.delete('does-not-exist');

      expect(deleted.ok).toBe(false);
      if (deleted.ok) return;
      expect(deleted.error.code).toBe('DIARY_ENTRY_NOT_FOUND');
    });
  });
});
