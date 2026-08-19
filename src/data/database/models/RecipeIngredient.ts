import { Model, type Relation } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

import type Food from './Food';
import type Recipe from './Recipe';

export default class RecipeIngredient extends Model {
  static table = 'recipe_ingredients';
  static associations = {
    recipes: { type: 'belongs_to' as const, key: 'recipe_id' },
    foods: { type: 'belongs_to' as const, key: 'food_id' },
  };

  @field('recipe_id') recipeId!: string;
  @field('food_id') foodId!: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  // KCAL-163d: which food_portions row this ingredient was entered via, if any. May become
  // a dangling reference if that portion is later deleted from the food -- callers must
  // handle a lookup miss gracefully (fall back to reference-unit display), never assume it
  // still resolves.
  @field('portion_id') portionId?: string;

  @relation('recipes', 'recipe_id') recipe!: Relation<Recipe>;
  @relation('foods', 'food_id') food!: Relation<Food>;
}
