import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { ProfileSetupScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import StepIndicator from '@/ui/StepIndicator';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { ActivityLevelSection } from './ActivityLevelSection';
import { MeasurementFields } from './MeasurementFields';
import { PersonalInfoFields } from './PersonalInfoFields';
import { useProfileSetupForm } from './ProfileSetupScreen.helpers';
import { Content, Safe, scrollContentStyle } from './ProfileSetupScreen.styles';

export function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const form = useProfileSetupForm(navigation);

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

          <StepIndicator totalSteps={2} currentStep={1} />

          <Text variant="h1">{t('onboarding.profileSetup.title')}</Text>
          <Text variant="body" color="text.secondary">
            {t('onboarding.profileSetup.subtitle')}
          </Text>

          <PersonalInfoFields
            t={t}
            firstName={form.firstName}
            onFirstNameChange={form.setFirstName}
            firstNameError={form.errors.firstName}
            sex={form.sex}
            onSexChange={form.setSex}
          />

          <MeasurementFields
            t={t}
            age={form.age}
            onAgeChange={form.setAge}
            ageError={form.errors.age}
            height={form.height}
            onHeightChange={form.setHeight}
            heightError={form.errors.height}
            currentWeight={form.currentWeight}
            onCurrentWeightChange={form.setCurrentWeight}
            currentWeightError={form.errors.currentWeight}
            targetWeight={form.targetWeight}
            onTargetWeightChange={form.setTargetWeight}
            targetWeightError={form.errors.targetWeight}
          />

          <ActivityLevelSection
            t={t}
            activityLevel={form.activityLevel}
            onActivityLevelChange={form.setActivityLevel}
          />

          <Button
            testID="onboarding.profileSetup.continue"
            label={t('onboarding.profileSetup.continue')}
            onPress={form.handleContinue}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default ProfileSetupScreen;
