import type { Observable } from '@nozbe/watermelondb/utils/rx';

import type { DomainError, Food, Result } from '@/domain/types';

export type CreateFoodInput = Omit<
  Food,
  'id' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'isArchived'
> &
  Partial<Pick<Food, 'isFavorite' | 'isArchived'>>;

export type UpdateFoodInput = Partial<CreateFoodInput>;

export interface FoodRepository {
  /** Lecture ponctuelle (ex: chargement initial d'un formulaire d'édition). */
  findById(id: string): Promise<Result<Food, DomainError>>;
  /** Requête observée : émet une nouvelle liste à chaque écriture affectant le résultat (voir TECHNICAL_SPECS.MD §5.3). */
  search(query: string): Observable<Food[]>;
  create(input: CreateFoodInput): Promise<Result<Food, DomainError>>;
  update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>>;
  archive(id: string): Promise<Result<void, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
}
