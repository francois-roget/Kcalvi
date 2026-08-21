import { StyleSheet } from 'react-native';

import type { Theme } from '@/ui/theme';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 114,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    flexShrink: 1,
  },
  iconWrapper: {
    marginLeft: 12,
  },
});

export function getContainerStyle(theme: Theme) {
  return {
    backgroundColor: theme.colors.ink[800],
    borderRadius: theme.radius.lg,
  };
}
