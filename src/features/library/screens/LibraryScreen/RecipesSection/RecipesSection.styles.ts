import type { ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getAddButtonStyle(theme: Theme): ViewStyle {
  return {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink[800],
  };
}
