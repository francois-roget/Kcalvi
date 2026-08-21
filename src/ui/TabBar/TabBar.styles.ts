import { StyleSheet } from 'react-native';

import type { Theme } from '@/ui/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 11,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});

export function getContainerStyle(theme: Theme, bottomInset: number) {
  return {
    backgroundColor: theme.colors.sand[100],
    borderTopColor: theme.colors.sand[400],
    paddingBottom: Math.max(bottomInset, 24),
  };
}

export function getLabelStyle(focused: boolean, color: string) {
  return {
    fontSize: 11,
    fontFamily: focused ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
    color,
  };
}
