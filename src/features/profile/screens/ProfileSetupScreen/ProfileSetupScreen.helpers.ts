import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ActivityLevel, DomainError, Sex } from '@/domain/types';
import { assertValidAge, assertValidHeight, assertValidWeight } from '@/domain/validation';
import type { ProfileSetupScreenProps } from '@/navigation/types';
import { parseLocaleNumber } from '@/utils/format';

/** Local alias for the i18next translation function, kept minimal to avoid coupling to react-i18next's full generic surface. */
export type TFunction = (key: string, options?: Record<string, unknown>) => string;

export const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'active', 'very_active'];

export const ACTIVITY_STARS: Record<ActivityLevel, number> = {
  sedentary: 1,
  light: 2,
  active: 3,
  very_active: 4,
};

/** Builds the displayed error text from `error.code` — never use `error.message` directly (domain/ stays locale-independent, see TECHNICAL_SPECS.MD §2.2). */
function formatValidationError(error: DomainError, t: TFunction, field: string): string {
  if (error.code === 'OUT_OF_RANGE') {
    return t('validation.outOfRange', { field, min: error.min, max: error.max });
  }
  return t('validation.invalidNumber', { field });
}

/**
 * Encapsulates all profile-setup form state, validation and submit logic.
 * Component-local hook (not reused elsewhere), kept here per TECHNICAL_SPECS.MD §9.2.
 */
export function useProfileSetupForm(navigation: ProfileSetupScreenProps['navigation']) {
  const { t } = useTranslation();

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

  return {
    firstName,
    setFirstName,
    sex,
    setSex,
    activityLevel,
    setActivityLevel,
    age,
    setAge,
    height,
    setHeight,
    currentWeight,
    setCurrentWeight,
    targetWeight,
    setTargetWeight,
    errors,
    handleContinue,
  };
}
