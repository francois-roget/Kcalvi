import { StyleSheet } from 'react-native';

import type { Theme } from '@/ui/theme';
import { darken } from '@/utils/color';

export type ButtonVariant = 'primary' | 'secondary' | 'onDark' | 'ghost';
export type ButtonSize = 'lg' | 'md';

const HEIGHTS: Record<ButtonSize, number> = { lg: 50, md: 42 };

export function getButtonHeight(size: ButtonSize): number {
  return HEIGHTS[size];
}

export function getVariantColors(
  theme: Theme,
  variant: ButtonVariant,
  pressed: boolean,
): { backgroundColor: string; textColor: string } {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: pressed
          ? darken(theme.colors.terracotta[600], 0.08)
          : theme.colors.terracotta[600],
        textColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        backgroundColor: pressed ? darken(theme.colors.sand[300], 0.08) : theme.colors.sand[300],
        textColor: theme.colors.text.primary,
      };
    case 'onDark':
      return {
        backgroundColor: pressed ? darken(theme.colors.azure[400], 0.08) : theme.colors.azure[400],
        textColor: theme.colors.ink[900],
      };
    case 'ghost':
      return { backgroundColor: 'transparent', textColor: theme.colors.text.accent };
  }
}

export const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
