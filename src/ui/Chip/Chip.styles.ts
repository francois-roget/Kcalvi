import type { TextStyle, ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getChipStyle(theme: Theme, selected: boolean): ViewStyle {
  return {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: selected ? theme.colors.ink[800] : theme.colors.sand[300],
  };
}

export function getChipLabelStyle(theme: Theme, selected: boolean): TextStyle {
  return {
    color: selected ? '#FFFFFF' : theme.colors.text.secondary,
    fontFamily: selected ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
    fontSize: 13,
  };
}
