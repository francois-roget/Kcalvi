import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Card from '@/ui/Card';
import ProgressBar from '@/ui/ProgressBar';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatDecimal, formatInteger } from '@/utils/format';

import { styles } from './MacroCard.styles';

export type MacroCardProps = {
  label: string;
  value: number;
  goal: number;
  color: keyof Theme['colors']['macro'];
};

function MacroCard({ label, value, goal, color }: MacroCardProps) {
  const theme = useTheme() as Theme;
  const macroColor = theme.colors.macro[color];

  return (
    <Card tone="light" radius="xl" paddingVertical={12} paddingHorizontal={13} style={styles.card}>
      <Text variant="micro" color="text.tertiary">
        {label}
      </Text>

      <View style={styles.valueRow}>
        {/* fr-BE formatting, one decimal for the macro and an integer goal -- the display
            rule in interactions.md, applied here rather than at each call site (KCAL-184
            is this component's first consumer). */}
        <Text variant="body" style={styles.value}>
          {formatDecimal(value)}
        </Text>
        <Text variant="caption" style={styles.goal}>
          {`/${formatInteger(goal)} g`}
        </Text>
      </View>

      <ProgressBar progress={goal > 0 ? value / goal : 0} color={macroColor} />
    </Card>
  );
}

export default MacroCard;
