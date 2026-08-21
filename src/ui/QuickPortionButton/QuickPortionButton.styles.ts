import type { TextStyle, ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getButtonStyle(theme: Theme, selected: boolean): ViewStyle {
  return {
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: theme.radius.sm,
    backgroundColor: selected ? '#E9F1F6' : theme.colors.sand[300],
  };
}

export function getLabelStyle(theme: Theme, selected: boolean): TextStyle {
  return {
    color: selected ? theme.colors.text.accent : theme.colors.text.secondary,
    fontFamily: selected ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
  };
}
