import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type ProgressBarProps = {
  progress: number;
  color: string;
  trackColor?: string;
  height?: number;
};

export function ProgressBar({ progress, color, trackColor, height = 5 }: ProgressBarProps) {
  const theme = useTheme() as Theme;
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.min(Math.max(progress, 0), 1);

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(trackWidth * clamped, { duration: 450 }),
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={handleLayout}
      style={{
        height,
        borderRadius: theme.radius.pill,
        backgroundColor: trackColor ?? theme.colors.sand[400],
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[{ height, borderRadius: theme.radius.pill, backgroundColor: color }, fillStyle]}
      />
    </View>
  );
}

export default ProgressBar;
