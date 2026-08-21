import NumberField from '@/ui/NumberField';

import type { TFunction } from '../ProfileSetupScreen.helpers';
import { FieldGroup, Row } from './MeasurementFields.styles';

type MeasurementFieldsProps = {
  t: TFunction;
  age: string;
  onAgeChange: (value: string) => void;
  ageError?: string;
  height: string;
  onHeightChange: (value: string) => void;
  heightError?: string;
  currentWeight: string;
  onCurrentWeightChange: (value: string) => void;
  currentWeightError?: string;
  targetWeight: string;
  onTargetWeightChange: (value: string) => void;
  targetWeightError?: string;
};

export function MeasurementFields({
  t,
  age,
  onAgeChange,
  ageError,
  height,
  onHeightChange,
  heightError,
  currentWeight,
  onCurrentWeightChange,
  currentWeightError,
  targetWeight,
  onTargetWeightChange,
  targetWeightError,
}: MeasurementFieldsProps) {
  return (
    <>
      <Row>
        <FieldGroup>
          <NumberField
            testID="onboarding.age"
            label={t('onboarding.profileSetup.age')}
            unit={t('onboarding.profileSetup.ageUnit')}
            value={age}
            onChangeText={onAgeChange}
            error={ageError}
          />
        </FieldGroup>
        <FieldGroup>
          <NumberField
            testID="onboarding.height"
            label={t('onboarding.profileSetup.height')}
            unit={t('onboarding.profileSetup.heightUnit')}
            value={height}
            onChangeText={onHeightChange}
            error={heightError}
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
            onChangeText={onCurrentWeightChange}
            error={currentWeightError}
          />
        </FieldGroup>
        <FieldGroup>
          <NumberField
            testID="onboarding.targetWeight"
            label={t('onboarding.profileSetup.targetWeight')}
            unit={t('onboarding.profileSetup.weightUnit')}
            value={targetWeight}
            onChangeText={onTargetWeightChange}
            error={targetWeightError}
          />
        </FieldGroup>
      </Row>
    </>
  );
}

export default MeasurementFields;
