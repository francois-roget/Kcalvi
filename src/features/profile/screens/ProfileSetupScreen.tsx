import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import type { ActivityLevel, DomainError, Sex } from '@/domain/types';
import { assertValidAge, assertValidHeight, assertValidWeight } from '@/domain/validation';
import type { ProfileSetupScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Chip from '@/ui/Chip';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import NumberField from '@/ui/NumberField';
import StepIndicator from '@/ui/StepIndicator';
import Text from '@/ui/Text';
import TextField from '@/ui/TextField';
import type { Theme } from '@/ui/theme';
import { parseLocaleNumber } from '@/utils/format';

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

const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

const FieldGroup = styled.View`
  flex: 1;
`;

const ChipRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'active', 'very_active'];

const ACTIVITY_STARS: Record<ActivityLevel, number> = {
  sedentary: 1,
  light: 2,
  active: 3,
  very_active: 4,
};

/** Builds the displayed error text from `error.code` — never use `error.message` directly (domain/ stays locale-independent, see TECHNICAL_SPECS.MD §2.2). */
function formatValidationError(
  error: DomainError,
  t: (key: string, options?: Record<string, unknown>) => string,
  field: string,
): string {
  if (error.code === 'OUT_OF_RANGE') {
    return t('validation.outOfRange', { field, min: error.min, max: error.max });
  }
  return t('validation.invalidNumber', { field });
}

export function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const [firstName, setFirstName] = useState('');
  const [sex, setSex] = useState<Sex>('female');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleContinue() {
    const ageValue = parseLocaleNumber(age);
    const heightValue = parseLocaleNumber(height);
    const currentWeightValue = parseLocaleNumber(currentWeight);
    const targetWeightValue = parseLocaleNumber(targetWeight);

    const nextErrors: Record<string, string> = {};

    if (firstName.trim().length === 0) {
      nextErrors.firstName = t('onboarding.profileSetup.firstNameError');
    }

    const ageCheck = assertValidAge(ageValue);
    if (!ageCheck.ok) {
      nextErrors.age = formatValidationError(ageCheck.error, t, t('onboarding.profileSetup.age'));
    }

    const heightCheck = assertValidHeight(heightValue);
    if (!heightCheck.ok) {
      nextErrors.height = formatValidationError(
        heightCheck.error,
        t,
        t('onboarding.profileSetup.height'),
      );
    }

    const currentWeightCheck = assertValidWeight(currentWeightValue);
    if (!currentWeightCheck.ok) {
      nextErrors.currentWeight = formatValidationError(
        currentWeightCheck.error,
        t,
        t('onboarding.profileSetup.currentWeight'),
      );
    }

    const targetWeightCheck = assertValidWeight(targetWeightValue);
    if (!targetWeightCheck.ok) {
      nextErrors.targetWeight = formatValidationError(
        targetWeightCheck.error,
        t,
        t('onboarding.profileSetup.targetWeight'),
      );
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    navigation.navigate('GoalSetup', {
      firstName: firstName.trim(),
      sex,
      age: ageValue,
      height: heightValue,
      currentWeight: currentWeightValue,
      targetWeight: targetWeightValue,
      activityLevel,
    });
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

          <StepIndicator totalSteps={2} currentStep={1} />

          <Text variant="h1">{t('onboarding.profileSetup.title')}</Text>
          <Text variant="body" color="text.secondary">
            {t('onboarding.profileSetup.subtitle')}
          </Text>

          <TextField
            testID="onboarding.firstName"
            label={t('onboarding.profileSetup.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
            autoCapitalize="words"
          />

          <ChipRow>
            <Chip
              label={t('onboarding.profileSetup.sexMale')}
              selected={sex === 'male'}
              onPress={() => setSex('male')}
            />
            <Chip
              label={t('onboarding.profileSetup.sexFemale')}
              selected={sex === 'female'}
              onPress={() => setSex('female')}
            />
          </ChipRow>

          <Row>
            <FieldGroup>
              <NumberField
                testID="onboarding.age"
                label={t('onboarding.profileSetup.age')}
                unit={t('onboarding.profileSetup.ageUnit')}
                value={age}
                onChangeText={setAge}
                error={errors.age}
              />
            </FieldGroup>
            <FieldGroup>
              <NumberField
                testID="onboarding.height"
                label={t('onboarding.profileSetup.height')}
                unit={t('onboarding.profileSetup.heightUnit')}
                value={height}
                onChangeText={setHeight}
                error={errors.height}
              />
            </FieldGroup>
          </Row>

          <Row>
            <FieldGroup>
              <NumberField
                testID="onboarding.currentWeight"
                label={t('onboarding.profileSetup.currentWeight')}
                unit={t('onboarding.profileSetup.weightUnit')}
                value={currentWeight}
                onChangeText={setCurrentWeight}
                error={errors.currentWeight}
              />
            </FieldGroup>
            <FieldGroup>
              <NumberField
                testID="onboarding.targetWeight"
                label={t('onboarding.profileSetup.targetWeight')}
                unit={t('onboarding.profileSetup.weightUnit')}
                value={targetWeight}
                onChangeText={setTargetWeight}
                error={errors.targetWeight}
              />
            </FieldGroup>
          </Row>

          <Text variant="title">{t('onboarding.profileSetup.activityLevel')}</Text>
          <ListCard>
            {ACTIVITY_LEVELS.map((level) => (
              <ListRow
                key={level}
                label={t(`onboarding.profileSetup.activityLevels.${level}`)}
                stars={ACTIVITY_STARS[level]}
                selected={activityLevel === level}
                onPress={() => setActivityLevel(level)}
              />
            ))}
          </ListCard>

          <Button
            testID="onboarding.profileSetup.continue"
            label={t('onboarding.profileSetup.continue')}
            onPress={handleContinue}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default ProfileSetupScreen;
