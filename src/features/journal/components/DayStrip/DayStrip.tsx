import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatDayOfMonth, formatLongDate, formatWeekdayNarrow, toDayKey } from '@/utils/format';

import { Row, getDayStyle, styles } from './DayStrip.styles';

export type DayStripProps = {
  /** The seven days to show, Monday → Sunday (RM12). */
  days: Date[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
};

/**
 * The week's day selector (2b).
 *
 * KCAL-187 scope: the current week only -- no navigation to another week, no date picker, and
 * no per-day ✓ indicator (F28-F29 are Sprint 4). Selecting a day is nothing more than changing
 * the argument passed to `observeByDate`, so the extension point F28 needs already exists with
 * no extra code.
 */
export function DayStrip({ days, selectedDay, onSelectDay }: DayStripProps) {
  const theme = useTheme() as Theme;
  const selectedKey = toDayKey(selectedDay);

  return (
    <Row testID="journal.dayStrip">
      {days.map((day) => {
        // Compared by day key rather than by timestamp: the selected day and the strip's days
        // are built separately, so two Dates for the same day need not be the same instant.
        const isSelected = toDayKey(day) === selectedKey;

        return (
          <Pressable
            key={toDayKey(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={formatLongDate(day)}
            testID={`journal.day.${toDayKey(day)}`}
            style={getDayStyle(theme, isSelected)}
            onPress={() => onSelectDay(day)}
          >
            <Text variant="micro" color={isSelected ? 'onDark.muted' : 'text.tertiary'}>
              {formatWeekdayNarrow(day)}
            </Text>
            <Text
              variant="body"
              color={isSelected ? 'onDark.primary' : 'text.primary'}
              style={styles.dayNumber}
            >
              {formatDayOfMonth(day)}
            </Text>
          </Pressable>
        );
      })}
    </Row>
  );
}

export default DayStrip;
