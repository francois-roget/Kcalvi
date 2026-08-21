import { StyleSheet, type ViewStyle } from 'react-native';

import type { Theme } from '@/ui/theme';

// How far below the screen the sheet starts before it animates in, so it is always fully
// offscreen at rest even on very tall devices.
export const OFFSCREEN_Y = 600;

// Clearance kept between the top of the sheet and the top of the screen. A constant rather than
// `useSafeAreaInsets()` so the sheet does not require a SafeAreaProvider above it (it renders in
// its own Modal tree); it is sized to cover the tallest status bar / notch inset plus breathing
// room, and only ever matters for sheets tall enough to reach the top of the screen.
export const TOP_CLEARANCE = 72;

export function getSheetShadowStyle(theme: Theme): ViewStyle {
  return theme.shadows.sheet;
}

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,34,49,0.4)',
  },
  overlayPressable: {
    flex: 1,
  },
  sheetBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3DACB',
    alignSelf: 'center',
    marginBottom: 16,
  },
});
