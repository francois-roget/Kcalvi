export type BadgeType = 'DAILY_GOAL_MET' | 'WEEKLY_BUDGET_RESPECTED';

export type DailyBadgeContext = {
  dailyGoal: number;
  netCalories: number;
};

export type WeeklyBadgeContext = {
  weeklyBudget: number;
  weeklyNetConsumption: number;
};

/**
 * RM13 — a badge is never more favorable for a consumption far below the
 * goal than for a consumption within the target: the conditions below
 * explicitly exclude excessive under-shooting via `MIN_RATIO`, they don't
 * just test an upper bound.
 */
const MIN_RATIO = 0.9;
const MAX_RATIO = 1;

function isWithinTarget(value: number, target: number): boolean {
  return value >= target * MIN_RATIO && value <= target * MAX_RATIO;
}

export function evaluateDailyBadges(context: DailyBadgeContext): BadgeType[] {
  const earned: BadgeType[] = [];
  if (isWithinTarget(context.netCalories, context.dailyGoal)) {
    earned.push('DAILY_GOAL_MET');
  }
  return earned;
}

export function evaluateWeeklyBadges(context: WeeklyBadgeContext): BadgeType[] {
  const earned: BadgeType[] = [];
  if (isWithinTarget(context.weeklyNetConsumption, context.weeklyBudget)) {
    earned.push('WEEKLY_BUDGET_RESPECTED');
  }
  return earned;
}
