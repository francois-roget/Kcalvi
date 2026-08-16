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
 * RM13 — un badge n'est jamais plus favorable pour une consommation très
 * inférieure à l'objectif que pour une consommation dans la cible : les
 * conditions ci-dessous excluent explicitement le sous-dépassement excessif
 * via `MIN_RATIO`, elles ne testent pas seulement une borne supérieure.
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
