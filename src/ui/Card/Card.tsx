import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { getLayoutStyle, getToneStyle, type CardTone } from './Card.styles';

export type CardProps = ViewProps & {
  tone?: CardTone;
  radius?: keyof Theme['radius'];
  paddingVertical?: number;
  paddingHorizontal?: number;
};

export function Card({
  tone = 'light',
  radius = '2xl',
  paddingVertical = 14,
  paddingHorizontal = 16,
  style,
  children,
  ...props
}: CardProps) {
  const theme = useTheme() as Theme;

  return (
    <View
      style={[
        getLayoutStyle(theme, radius, paddingVertical, paddingHorizontal),
        getToneStyle(theme, tone),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default Card;
