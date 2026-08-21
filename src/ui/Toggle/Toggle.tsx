import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { getTrackStyle, OFFSET, styles, THUMB_SIZE, TRACK_WIDTH } from './Toggle.styles';

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

function Toggle({ value, onValueChange, disabled, testID }: ToggleProps) {
  const theme = useTheme() as Theme;

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(value ? TRACK_WIDTH - THUMB_SIZE - OFFSET : OFFSET, {
          duration: 200,
        }),
      },
    ],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.track, getTrackStyle(theme, value, disabled)]}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

export default Toggle;
