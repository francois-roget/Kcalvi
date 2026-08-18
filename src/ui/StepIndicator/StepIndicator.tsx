import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type StepIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const theme = useTheme() as Theme;

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: index < currentStep ? theme.colors.azure[600] : theme.colors.sand[300],
          }}
        />
      ))}
    </View>
  );
}

export default StepIndicator;
