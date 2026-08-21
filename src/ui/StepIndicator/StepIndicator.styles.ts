import type { ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getContainerStyle(theme: Theme): ViewStyle {
  return {
    flexDirection: 'row',
    gap: theme.spacing[2],
  };
}

export function getStepStyle(theme: Theme, isActive: boolean): ViewStyle {
  return {
    flex: 1,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: isActive ? theme.colors.azure[600] : theme.colors.sand[300],
  };
}
