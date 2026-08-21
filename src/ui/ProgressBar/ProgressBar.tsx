import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { getFillStyle, getTrackStyle } from './ProgressBar.styles';

export type ProgressBarProps = {
  progress: number;
  color: string;
  trackColor?: string;
  height?: number;
};

function ProgressBar({ progress, color, trackColor, height = 5 }: ProgressBarProps) {
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
    <View onLayout={handleLayout} style={getTrackStyle(theme, height, trackColor)}>
      <Animated.View style={[getFillStyle(theme, height, color), fillStyle]} />
    </View>
  );
}

export default ProgressBar;
