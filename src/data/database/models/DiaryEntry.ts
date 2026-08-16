import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

import type Food from './Food';
import type Recipe from './Recipe';

export default class DiaryEntry extends Model {
  static table = 'diary_entries';
  static associations = {
    foods: { type: 'belongs_to' as const, key: 'food_id' },
    recipes: { type: 'belongs_to' as const, key: 'recipe_id' },
  };

  @date('date') date!: Date;
  @field('meal_type') mealType!: string;
  @field('food_id') foodId?: string;
  @field('recipe_id') recipeId?: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  @readonly @date('created_at') createdAt!: Date;

  @relation('foods', 'food_id') food!: Relation<Food>;
  @relation('recipes', 'recipe_id') recipe!: Relation<Recipe>;
}
