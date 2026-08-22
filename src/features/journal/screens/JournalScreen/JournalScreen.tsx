import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { DayStrip } from '@/features/journal/components/DayStrip';
import Text from '@/ui/Text';
import { formatMonthYear } from '@/utils/format';

import { useWeekDays } from './JournalScreen.helpers';
import { Content, Header, Safe, styles } from './JournalScreen.styles';

export function JournalScreen() {
  const { t } = useTranslation();

  // Resolved once per mount: the journal day only rolls over at local midnight
  // (TECHNICAL_SPECS §8.1), so a fresh Date per render would churn the week and the query.
  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(today);
  const weekDays = useWeekDays(today);

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header>
          <Text variant="h2">{t('journal.title')}</Text>
          {/* The month follows the selected day, not today: picking Monday 31 August from a
              week that starts in July has to say which month you are looking at. */}
          <Text variant="overline" color="text.tertiary" style={styles.month}>
            {formatMonthYear(selectedDay)}
          </Text>
        </Header>

        <Content>
          <DayStrip days={weekDays} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        </Content>
      </ScrollView>
    </Safe>
  );
}
