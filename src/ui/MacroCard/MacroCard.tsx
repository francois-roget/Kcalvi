import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Card from '@/ui/Card';
import ProgressBar from '@/ui/ProgressBar';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type MacroCardProps = {
  label: string;
  value: number;
  goal: number;
  color: keyof Theme['colors']['macro'];
};

export function MacroCard({ label, value, goal, color }: MacroCardProps) {
  const theme = useTheme() as Theme;
  const macroColor = theme.colors.macro[color];

  return (
    <Card tone="light" radius="xl" paddingVertical={12} paddingHorizontal={13} style={{ flex: 1 }}>
      <Text variant="micro" color="text.tertiary">
        {label}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4, marginBottom: 8 }}>
        <Text variant="body" style={{ fontFamily: 'Manrope_800ExtraBold', fontSize: 16 }}>
          {value}
        </Text>
        <Text variant="caption" style={{ color: '#B3BEC6', marginLeft: 2 }}>
          {`/${goal} g`}
        </Text>
      </View>

      <ProgressBar progress={goal > 0 ? value / goal : 0} color={macroColor} />
    </Card>
  );
}

export default MacroCard;
