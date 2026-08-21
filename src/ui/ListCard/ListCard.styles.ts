import type { ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

// Wrapper separate from the Card (which carries the shadow): clips row backgrounds
// (e.g. a selected row's highlight) to the rounded corners without cutting the shadow.
export function getWrapperStyle(theme: Theme): ViewStyle {
  return { borderRadius: theme.radius['2xl'], overflow: 'hidden' };
}
