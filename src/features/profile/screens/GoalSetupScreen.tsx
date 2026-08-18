import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import {
  calculateBMR,
  calculateDailyCalorieGoal,
  calculateDailyDeficit,
  calculateSuggestedMacros,
  calculateTDEE,
  calculateWeeklyBudget,
} from '@/domain/calculations';
import { profileRepository } from '@/data/repositories';
import type { GoalSetupScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Chip from '@/ui/Chip';
import HeroCard from '@/ui/HeroCard';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import StatTile from '@/ui/StatTile';
import StepIndicator from '@/ui/StepIndicator';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatInteger, formatKcal } from '@/utils/format';

const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

const Content = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[8]}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

const StatRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const InfoBox = styled.View`
  background-color: ${({ theme }) => theme.colors.azure[50]};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border.info};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  padding: ${({ theme }) => theme.spacing[4]}px;
`;

const RATES = [0.25, 0.5, 0.75] as const;

function formatRate(value: number): string {
  return value.toString().replace('.', ',');
}

export function GoalSetupScreen({ route, navigation }: GoalSetupScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const { firstName, sex, age, height, currentWeight, targetWeight, activityLevel } = route.params;
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

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Content>
          <Pressable
            testID="onboarding.back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </Pressable>

          <StepIndicator totalSteps={2} currentStep={2} />

          <Text variant="h1">{t('onboarding.goalSetup.title')}</Text>

          <HeroCard>
            <Text variant="overline" color="onDark.subtle">
              {t('onboarding.goalSetup.dailyCalories')}
            </Text>
            <Text variant="display" color="onDark.primary" style={{ marginTop: 4 }}>
              {formatInteger(dailyCalorieGoal)}
            </Text>
          </HeroCard>

          <StatRow>
            <StatTile
              label={t('onboarding.goalSetup.maintenance')}
              value={formatKcal(tdee)}
              tone="accent"
            />
            <StatTile
              label={t('onboarding.goalSetup.deficit')}
              value={`-${formatKcal(deficit)}`}
              tone="accent"
            />
            <StatTile
              label={t('onboarding.goalSetup.week')}
              value={formatKcal(weeklyBudget)}
              tone="accent"
            />
          </StatRow>

          <Text variant="title">{t('onboarding.goalSetup.rateLabel')}</Text>
          <ChipRow>
            {RATES.map((rate) => (
              <Chip
                key={rate}
                label={t('onboarding.goalSetup.rateChip', { rate: formatRate(rate) })}
                selected={weeklyRateKg === rate}
                onPress={() => setWeeklyRateKg(rate)}
              />
            ))}
          </ChipRow>

          <ListCard>
            <ListRow
              label={t('onboarding.goalSetup.protein')}
              value={`${formatInteger(macros.protein)} g`}
            />
            <ListRow
              label={t('onboarding.goalSetup.carbs')}
              value={`${formatInteger(macros.carbs)} g`}
            />
            <ListRow
              label={t('onboarding.goalSetup.fat')}
              value={`${formatInteger(macros.fat)} g`}
              isLast
            />
          </ListCard>

          <InfoBox>
            <Text variant="bodySm" color="text.secondary">
              {t('onboarding.goalSetup.weeklyBudgetInfo')}
            </Text>
          </InfoBox>

          <Button
            label={t('onboarding.goalSetup.createProfile')}
            onPress={handleCreateProfile}
            disabled={submitting}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default GoalSetupScreen;
