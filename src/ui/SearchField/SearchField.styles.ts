import type { TextStyle, ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getContainerStyle(theme: Theme): ViewStyle {
  return {
    backgroundColor: theme.colors.sand[300],
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  };
}

export function getInputStyle(theme: Theme, showClearButton: boolean): TextStyle {
  return {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: showClearButton ? 8 : 16,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: theme.colors.text.primary,
  };
}

export const clearButtonStyle: ViewStyle = {
  paddingHorizontal: 10,
  alignItems: 'center',
  justifyContent: 'center',
};

// Icon size + hitSlop (10 each side) reaches theme.layout.minTouchTarget (44pt)
// without stretching the container's height beyond its original visual style.
export function getClearIconSize(theme: Theme): number {
  return theme.layout.minTouchTarget - 20;
}
