import { useMemo, useState } from 'react';

import {
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateDailyDeficit,
  calculateSuggestedMacros,
  calculateTDEE,
  calculateWeeklyBudget,
} from '@/domain/calculations';
import type { NutritionValues } from '@/domain/types';
import { profileRepository } from '@/data/repositories';
import type { OnboardingProfileDraft } from '@/navigation/types';

export type UseGoalSetupResult = {
  weeklyRateKg: number;
  setWeeklyRateKg: (rate: number) => void;
  submitting: boolean;
  tdee: number;
  deficit: number;
  dailyCalorieGoal: number;
  macros: NutritionValues;
  weeklyBudget: number;
  handleCreateProfile: () => Promise<void>;
};

/**
 * Encapsulates the goal-setup calculations (BMR/TDEE/deficit/macros derived from the
 * onboarding draft and the chosen weekly rate) and the profile-creation submit handler.
 * Local to this screen — not reused elsewhere, hence living in `.helpers.ts` rather than
 * a shared `hooks/` location (see TECHNICAL_SPECS.MD §9.2).
 */
export function useGoalSetup(params: OnboardingProfileDraft): UseGoalSetupResult {
  const { firstName, sex, age, height, currentWeight, targetWeight, activityLevel } = params;
  const [weeklyRateKg, setWeeklyRateKg] = useState<number>(0.5);
  const [submitting, setSubmitting] = useState(false);

  const bmr = useMemo(
    () => calculateBMR(sex, currentWeight, height, age),
    [sex, currentWeight, height, age],
  );
  const tdee = useMemo(() => calculateTDEE(bmr, activityLevel), [bmr, activityLevel]);
  const deficit = useMemo(() => calculateDailyDeficit(weeklyRateKg), [weeklyRateKg]);
  const dailyCalorieGoal = useMemo(() => calculateDailyCalorieGoal(tdee, deficit), [tdee, deficit]);
  const macros = useMemo(
    () => calculateSuggestedMacros(dailyCalorieGoal, currentWeight),
    [dailyCalorieGoal, currentWeight],
  );
  const weeklyBudget = useMemo(() => calculateWeeklyBudget(dailyCalorieGoal), [dailyCalorieGoal]);

  async function handleCreateProfile() {
    setSubmitting(true);
    const result = await profileRepository.create({
      name: firstName,
      dailyCalorieGoal,
      proteinGoal: macros.protein,
      carbGoal: macros.carbs,
      fatGoal: macros.fat,
      startWeight: currentWeight,
      currentWeight,
      targetWeight,
      sex,
      age,
      height,
      activityLevel,
    });
    setSubmitting(false);

    if (!result.ok) return;
    // Navigation to the tabs happens automatically: RootNavigator observes
    // profileRepository.observe() and switches over as soon as the profile exists.
  }

  return {
    weeklyRateKg,
    setWeeklyRateKg,
    submitting,
    tdee,
    deficit,
    dailyCalorieGoal,
    macros,
    weeklyBudget,
    handleCreateProfile,
  };
}
