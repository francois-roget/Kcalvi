import { StyleSheet } from 'react-native';

import type { Theme } from '@/ui/theme';

export const TRACK_WIDTH = 44;
export const TRACK_HEIGHT = 26;
export const THUMB_SIZE = 20;
export const OFFSET = 3;

export const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
});

export function getTrackStyle(theme: Theme, value: boolean, disabled?: boolean) {
  return {
    borderRadius: theme.radius.pill,
    backgroundColor: value ? theme.colors.azure[600] : '#E3DACB',
    opacity: disabled ? 0.45 : 1,
  };
}
