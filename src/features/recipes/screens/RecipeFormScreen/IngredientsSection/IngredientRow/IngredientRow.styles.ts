import { StyleSheet, type ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

export const styles = StyleSheet.create({
  info: { flexShrink: 1, paddingRight: 12 },
  quantityText: { marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});

export function getRowContainerStyle(theme: Theme, isLast?: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: theme.colors.border.subtle,
  };
}
