import type { DomainError, Food, Result } from '@/domain/types';

export type CreateFoodInput = Omit<
  Food,
  'id' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'isArchived'
> &
  Partial<Pick<Food, 'isFavorite' | 'isArchived'>>;

export type UpdateFoodInput = Partial<CreateFoodInput>;

export interface FoodRepository {
  findById(id: string): Promise<Result<Food, DomainError>>;
  search(query: string): Promise<Food[]>;
  create(input: CreateFoodInput): Promise<Result<Food, DomainError>>;
  update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>>;
  archive(id: string): Promise<Result<void, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
}
