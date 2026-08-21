import { StyleSheet, type ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingRight: 12,
  },
  checkmarkIcon: {
    marginRight: 8,
  },
  labelTextWrapper: {
    flexShrink: 1,
  },
  selectedLabel: {
    fontFamily: 'Manrope_700Bold',
  },
  sublabel: {
    marginTop: 2,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
});

export function getRowStyle(theme: Theme, selected: boolean, isLast?: boolean): ViewStyle {
  return {
    backgroundColor: selected ? theme.colors.azure[50] : 'transparent',
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: theme.colors.border.subtle,
  };
}

export function getStarColor(theme: Theme, active: boolean, selected: boolean): string {
  if (!active) {
    return theme.colors.text.disabled;
  }
  return selected ? theme.colors.azure[600] : theme.colors.text.secondary;
}

export function getAccessoryStarColor(theme: Theme, active: boolean): string {
  return active ? theme.colors.azure[400] : theme.colors.text.disabled;
}
