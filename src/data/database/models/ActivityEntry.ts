import { Model } from '@nozbe/watermelondb';
import { date, field, text } from '@nozbe/watermelondb/decorators';

export default class ActivityEntry extends Model {
  static table = 'activity_entries';

  @date('date') date!: Date;
  @text('name') name!: string;
  @field('duration') duration!: number;
  @field('calories_burned') caloriesBurned!: number;
  @field('notes') notes?: string;
}
