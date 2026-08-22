import type { Observable } from '@nozbe/watermelondb/utils/rx';

import type { DiaryEntry, DomainError, Result } from '@/domain/types';

// Discriminated union: makes "both foodId and recipeId set" (or neither) an
// invalid state that cannot be represented, rather than a runtime check that
// would otherwise return an error Result. portionId only makes sense for a
// food source (see FoodPortion / KCAL-163d) -- a recipe source has no portion.
export type DiaryEntrySource =
  { kind: 'food'; foodId: string; portionId?: string } | { kind: 'recipe'; recipeId: string };

export type CreateDiaryEntryInput = Omit<
  DiaryEntry,
  'id' | 'createdAt' | 'updatedAt' | 'foodId' | 'recipeId' | 'portionId'
> & {
  source: DiaryEntrySource;
};

export type UpdateDiaryEntryInput = Partial<CreateDiaryEntryInput>;

export interface DiaryEntryRepository {
  /** One-off read (e.g. opening the quantity/meal edit sheet). */
  findById(id: string): Promise<Result<DiaryEntry, DomainError>>;
  /** Observed query: emits a new list on every write affecting the result (see TECHNICAL_SPECS.MD §5.3). */
  observeByDate(date: Date): Observable<DiaryEntry[]>;
  create(input: CreateDiaryEntryInput): Promise<Result<DiaryEntry, DomainError>>;
  update(id: string, input: UpdateDiaryEntryInput): Promise<Result<DiaryEntry, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
}
