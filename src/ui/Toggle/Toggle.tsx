import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const OFFSET = 3;

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
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
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={{
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: theme.radius.pill,
        backgroundColor: value ? theme.colors.azure[600] : '#E3DACB',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Animated.View
        style={[
          {
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#FFFFFF',
          },
          thumbStyle,
        ]}
      />
    </Pressable>
  );
}

export default Toggle;
