import { useTranslation } from 'react-i18next';

import type { NutritionValues, UserProfile } from '@/domain/types';
import MacroCard from '@/ui/MacroCard';

import { Row } from './TodayMacros.styles';

export type TodayMacrosProps = {
  /** Already aggregated by `calculateConsumedNutrition` -- this component never sums. */
  consumed: NutritionValues;
  profile: UserProfile;
};

/** The three macro cards of 2a: today's P / G / L against the profile's goals. */
export function TodayMacros({ consumed, profile }: TodayMacrosProps) {
  const { t } = useTranslation();

  return (
    <Row testID="today.macros">
      <MacroCard
        label={t('today.macros.protein')}
        value={consumed.protein}
        goal={profile.proteinGoal}
        color="protein"
      />
      <MacroCard
        label={t('today.macros.carbs')}
        value={consumed.carbs}
        goal={profile.carbGoal}
        color="carbs"
      />
      <MacroCard
        label={t('today.macros.fat')}
        value={consumed.fat}
        goal={profile.fatGoal}
        color="fat"
      />
    </Row>
  );
}

export default TodayMacros;
