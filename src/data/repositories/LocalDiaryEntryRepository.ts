import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { map, type Observable } from '@nozbe/watermelondb/utils/rx';

import { assertNonNegative } from '@/domain/validation';
import type { DiaryEntry, DomainError, Result } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import DiaryEntryModel from '../database/models/DiaryEntry';
import type {
  CreateDiaryEntryInput,
  DiaryEntryRepository,
  UpdateDiaryEntryInput,
} from './DiaryEntryRepository';
import { toDomainDiaryEntry } from './mapping';

async function findRecord(
  database: Database,
  id: string,
): Promise<Result<DiaryEntryModel, DomainError>> {
  try {
    return ok(await database.get<DiaryEntryModel>('diary_entries').find(id));
  } catch {
    return err({ code: 'DIARY_ENTRY_NOT_FOUND', message: `DiaryEntry ${id} not found` });
  }
}

export class LocalDiaryEntryRepository implements DiaryEntryRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Result<DiaryEntry, DomainError>> {
    const found = await findRecord(this.database, id);
    if (!found.ok) return found;
    return ok(toDomainDiaryEntry(found.value));
  }

  observeByDate(date: Date): Observable<DiaryEntry[]> {
    // Exact-timestamp match: normalizing to a start-of-day write and querying a
    // [start, end) range is KCAL-169's job, not this ticket's. Until then, callers
    // must pass the exact Date a diary_entries row was written with.
    return this.database
      .get<DiaryEntryModel>('diary_entries')
      .query(Q.where('date', date.getTime()))
      .observe()
      .pipe(map((records) => records.map(toDomainDiaryEntry)));
  }

  async create(input: CreateDiaryEntryInput): Promise<Result<DiaryEntry, DomainError>> {
    const quantityCheck = assertNonNegative(input.quantity, 'quantity');
    if (!quantityCheck.ok) return quantityCheck;

    // RM16: the caller (QuantitySheet, RM02) already computed calories/protein/carbs/fat
    // and the frozen `label` -- this repository only persists them, it never imports
    // domain/calculations itself.
    const created = await this.database.write(() =>
      this.database.get<DiaryEntryModel>('diary_entries').create((row) => {
        row.date = input.date;
        row.mealType = input.mealType;
        if (input.source.kind === 'food') {
          row.foodId = input.source.foodId;
          row.portionId = input.source.portionId;
        } else {
          row.recipeId = input.source.recipeId;
        }
        row.quantity = input.quantity;
        row.unit = input.unit;
        row.calories = input.calories;
        row.protein = input.protein;
        row.carbs = input.carbs;
        row.fat = input.fat;
        row.label = input.label;
      }),
    );

    return ok(toDomainDiaryEntry(created));
  }

  async update(id: string, input: UpdateDiaryEntryInput): Promise<Result<DiaryEntry, DomainError>> {
    if (input.quantity !== undefined) {
      const quantityCheck = assertNonNegative(input.quantity, 'quantity');
      if (!quantityCheck.ok) return quantityCheck;
    }

    const found = await findRecord(this.database, id);
    if (!found.ok) return found;

    const updated = await this.database.write(() =>
      found.value.update((row) => {
        if (input.date !== undefined) row.date = input.date;
        if (input.mealType !== undefined) row.mealType = input.mealType;
        if (input.source !== undefined) {
          if (input.source.kind === 'food') {
            row.foodId = input.source.foodId;
            row.portionId = input.source.portionId;
            row.recipeId = undefined;
          } else {
            row.recipeId = input.source.recipeId;
            row.foodId = undefined;
            row.portionId = undefined;
          }
        }
        if (input.quantity !== undefined) row.quantity = input.quantity;
        if (input.unit !== undefined) row.unit = input.unit;
        if (input.calories !== undefined) row.calories = input.calories;
        if (input.protein !== undefined) row.protein = input.protein;
        if (input.carbs !== undefined) row.carbs = input.carbs;
        if (input.fat !== undefined) row.fat = input.fat;
        if (input.label !== undefined) row.label = input.label;
      }),
    );

    return ok(toDomainDiaryEntry(updated));
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    const found = await findRecord(this.database, id);
    if (!found.ok) return found;

    await this.database.write(() => found.value.destroyPermanently());
    return ok(undefined);
  }
}
