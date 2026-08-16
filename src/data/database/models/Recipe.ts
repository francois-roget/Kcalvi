import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

import type RecipeIngredient from './RecipeIngredient';

export default class Recipe extends Model {
  static table = 'recipes';
  static associations = {
    recipe_ingredients: { type: 'has_many' as const, foreignKey: 'recipe_id' },
  };

  @text('name') name!: string;
  @field('servings') servings!: number;
  @field('notes') notes?: string;
  @field('is_favorite') isFavorite!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('recipe_ingredients') ingredients!: Query<RecipeIngredient>;
}
