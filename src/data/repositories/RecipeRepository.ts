import type { Observable } from '@nozbe/watermelondb/utils/rx';

import type { DomainError, Recipe, RecipeIngredient, Result } from '@/domain/types';

export type CreateRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> &
  Partial<Pick<Recipe, 'isFavorite'>> & {
    ingredients: { foodId: string; quantity: number; unit: string }[];
  };

export type UpdateRecipeInput = Partial<CreateRecipeInput>;

export interface RecipeRepository {
  /** One-off read (e.g. initial load of an edit form). */
  findById(id: string): Promise<Result<Recipe, DomainError>>;
  /** Observed query: emits a new list on every write affecting the result (see TECHNICAL_SPECS.MD §5.3). */
  search(query: string): Observable<Recipe[]>;
  create(input: CreateRecipeInput): Promise<Result<Recipe, DomainError>>;
  update(id: string, input: UpdateRecipeInput): Promise<Result<Recipe, DomainError>>;
  archive(id: string): Promise<Result<void, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
  /** Internal helper query (not user-facing): all RecipeIngredient rows referencing this food. */
  findUsagesByFoodId(foodId: string): Promise<RecipeIngredient[]>;
}
