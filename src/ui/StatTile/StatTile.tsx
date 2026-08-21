import { useTheme } from 'styled-components/native';

import Card from '@/ui/Card';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getToneConfig, getValueTextStyle, type StatTileTone } from './StatTile.styles';

export type { StatTileTone };

export type StatTileProps = {
  label: string;
  value: string;
  tone?: StatTileTone;
};

function StatTile({ label, value, tone = 'dark' }: StatTileProps) {
  const theme = useTheme() as Theme;
  const config = getToneConfig(tone);
  const isDark = tone === 'dark';

  return (
    <Card
      tone={config.cardTone}
      radius={isDark ? 'md' : '2xl'}
      paddingVertical={isDark ? 10 : 13}
      paddingHorizontal={isDark ? 12 : 15}
    >
      <Text variant="micro" color={config.labelColor}>
        {label}
      </Text>
      <Text style={getValueTextStyle(theme, tone)}>{value}</Text>
    </Card>
  );
}

export default StatTile;
