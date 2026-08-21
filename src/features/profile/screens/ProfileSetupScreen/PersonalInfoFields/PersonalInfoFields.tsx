import type { Sex } from '@/domain/types';
import Chip from '@/ui/Chip';
import TextField from '@/ui/TextField';

import type { TFunction } from '../ProfileSetupScreen.helpers';
import { ChipRow } from './PersonalInfoFields.styles';

type PersonalInfoFieldsProps = {
  t: TFunction;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  firstNameError?: string;
  sex: Sex;
  onSexChange: (sex: Sex) => void;
};

export function PersonalInfoFields({
  t,
  firstName,
  onFirstNameChange,
  firstNameError,
  sex,
  onSexChange,
}: PersonalInfoFieldsProps) {
  return (
    <>
      <TextField
        testID="onboarding.firstName"
        label={t('onboarding.profileSetup.firstName')}
        value={firstName}
        onChangeText={onFirstNameChange}
        error={firstNameError}
        autoCapitalize="words"
      />

      <ChipRow>
        <Chip
          label={t('onboarding.profileSetup.sexMale')}
          selected={sex === 'male'}
          onPress={() => onSexChange('male')}
        />
        <Chip
          label={t('onboarding.profileSetup.sexFemale')}
          selected={sex === 'female'}
          onPress={() => onSexChange('female')}
        />
      </ChipRow>
    </>
  );
}

export default PersonalInfoFields;
