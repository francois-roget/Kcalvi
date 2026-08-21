import type { ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export type CardTone = 'light' | 'dark' | 'info' | 'accent' | 'warm' | 'muted' | 'dashed';

export function getLayoutStyle(
  theme: Theme,
  radius: keyof Theme['radius'],
  paddingVertical: number,
  paddingHorizontal: number,
): ViewStyle {
  return {
    borderRadius: theme.radius[radius],
    paddingVertical,
    paddingHorizontal,
  };
}

export function getToneStyle(theme: Theme, tone: CardTone): ViewStyle {
  switch (tone) {
    case 'light':
      return { backgroundColor: '#FFFFFF', ...theme.shadows.card };
    case 'dark':
      return { backgroundColor: theme.colors.ink[800] };
    case 'info':
      return {
        backgroundColor: theme.colors.azure[50],
        borderWidth: 1,
        borderColor: theme.colors.border.info,
      };
    case 'accent':
      return { backgroundColor: theme.colors.azure[100] };
    case 'warm':
      return { backgroundColor: theme.colors.terracotta[100] };
    case 'muted':
      return { backgroundColor: theme.colors.sand[200] };
    case 'dashed':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: theme.colors.border.dashed,
      };
  }
}
