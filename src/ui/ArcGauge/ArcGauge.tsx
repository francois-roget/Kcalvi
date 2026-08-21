import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getContainerStyle, styles } from './ArcGauge.styles';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const VIEWBOX_WIDTH = 250;
const VIEWBOX_HEIGHT = 132;
const ARC_PATH = 'M22 122 A103 103 0 0 1 228 122';
const TOTAL_LENGTH = 324;

export type ArcGaugeProps = {
  value: number;
  goal: number;
  subtitle?: string;
  width?: number;
};

function ArcGauge({ value, goal, subtitle, width = VIEWBOX_WIDTH }: ArcGaugeProps) {
  const theme = useTheme() as Theme;
  const progress = goal > 0 ? Math.min(Math.max(value / goal, 0), 1) : 0;
  const overGoal = value > goal;
  const height = (width / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(TOTAL_LENGTH * (1 - progress), {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }),
  }));

  return (
    <View style={getContainerStyle(width, height)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Path
          d={ARC_PATH}
          stroke={theme.colors.ink[700]}
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          d={ARC_PATH}
          stroke={overGoal ? theme.colors.terracotta[600] : theme.colors.azure[400]}
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={TOTAL_LENGTH}
          animatedProps={animatedProps}
        />
      </Svg>

      <View style={styles.valueOverlay}>
        <Text variant="display" color="onDark.primary">
          {Math.round(value)}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="onDark.muted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default ArcGauge;
