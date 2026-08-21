import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { getContainerStyle, getStepStyle } from './StepIndicator.styles';

export type StepIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const theme = useTheme() as Theme;

  return (
    <View style={getContainerStyle(theme)}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View key={index} style={getStepStyle(theme, index < currentStep)} />
      ))}
    </View>
  );
}

export default StepIndicator;
