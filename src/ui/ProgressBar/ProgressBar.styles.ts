import type { ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export function getTrackStyle(theme: Theme, height: number, trackColor?: string): ViewStyle {
  return {
    height,
    borderRadius: theme.radius.pill,
    backgroundColor: trackColor ?? theme.colors.sand[400],
    overflow: 'hidden',
  };
}

export function getFillStyle(theme: Theme, height: number, color: string): ViewStyle {
  return {
    height,
    borderRadius: theme.radius.pill,
    backgroundColor: color,
  };
}
