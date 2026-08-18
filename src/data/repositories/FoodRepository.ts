import type { Observable } from '@nozbe/watermelondb/utils/rx';

import type { DomainError, Food, Result } from '@/domain/types';

export type CreateFoodInput = Omit<
  Food,
  'id' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'isArchived'
> &
  Partial<Pick<Food, 'isFavorite' | 'isArchived'>>;

export type UpdateFoodInput = Partial<CreateFoodInput>;

export interface FoodRepository {
  /** One-off read (e.g. initial load of an edit form). */
  findById(id: string): Promise<Result<Food, DomainError>>;
  /** Observed query: emits a new list on every write affecting the result (see TECHNICAL_SPECS.MD §5.3). */
  search(query: string): Observable<Food[]>;
  create(input: CreateFoodInput): Promise<Result<Food, DomainError>>;
  update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>>;
  archive(id: string): Promise<Result<void, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
}
