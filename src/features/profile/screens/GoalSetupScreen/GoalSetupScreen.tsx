import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { GoalSetupScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import StepIndicator from '@/ui/StepIndicator';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { useGoalSetup } from './GoalSetupScreen.helpers';
import { Content, Safe, scrollContentStyle } from './GoalSetupScreen.styles';
import { GoalSummary } from './GoalSummary';
import { RateSelector } from './RateSelector';

export function GoalSetupScreen({ route, navigation }: GoalSetupScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const {
    weeklyRateKg,
    setWeeklyRateKg,
    submitting,
    tdee,
    deficit,
    dailyCalorieGoal,
    macros,
    weeklyBudget,
    handleCreateProfile,
  } = useGoalSetup(route.params);

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={scrollContentStyle}>
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

          <GoalSummary
            tdee={tdee}
            deficit={deficit}
            dailyCalorieGoal={dailyCalorieGoal}
            weeklyBudget={weeklyBudget}
            macros={macros}
          />

          <RateSelector weeklyRateKg={weeklyRateKg} onSelectRate={setWeeklyRateKg} />

          <Button
            testID="onboarding.goalSetup.createProfile"
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
