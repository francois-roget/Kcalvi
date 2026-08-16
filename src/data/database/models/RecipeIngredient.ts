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

  @relation('recipes', 'recipe_id') recipe!: Relation<Recipe>;
  @relation('foods', 'food_id') food!: Relation<Food>;
}
