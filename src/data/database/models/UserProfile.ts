import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class UserProfile extends Model {
  static table = 'user_profiles';

  @field('name') name!: string;
  @field('daily_calorie_goal') dailyCalorieGoal!: number;
  @field('protein_goal') proteinGoal!: number;
  @field('carb_goal') carbGoal!: number;
  @field('fat_goal') fatGoal!: number;
  @field('start_weight') startWeight!: number;
  @field('current_weight') currentWeight!: number;
  @field('target_weight') targetWeight!: number;
  @field('sex') sex!: string;
  @field('age') age!: number;
  @field('height') height!: number;
  @field('activity_level') activityLevel!: string;
  @field('singleton') singleton!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
