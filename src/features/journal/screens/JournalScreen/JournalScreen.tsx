import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { diaryEntryRepository, profileRepository } from '@/data/repositories';
import { calculateConsumedNutrition } from '@/domain/calculations';
import type { DiaryEntry } from '@/domain/types';
import { DayStrip } from '@/features/journal/components/DayStrip';
import { useObservable } from '@/hooks/useObservable';
import Text from '@/ui/Text';
import { formatMonthYear } from '@/utils/format';

import { JournalHeroCard } from './JournalHeroCard';
import { useWeekDays } from './JournalScreen.helpers';
import { Content, Header, Safe, styles } from './JournalScreen.styles';

const EMPTY_ENTRIES: DiaryEntry[] = [];

export function JournalScreen() {
  const { t } = useTranslation();

  // Resolved once per mount: the journal day only rolls over at local midnight
  // (TECHNICAL_SPECS §8.1), so a fresh Date per render would churn the week and the query.
  const today = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(today);
  const weekDays = useWeekDays(today);

  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable(profileObservable, null);

  // Re-subscribed when the selected day changes -- that is the whole of "changing day"
  // (KCAL-187), and the extension point F28 will reuse in Sprint 4.
  const entriesObservable = useMemo(
    () => diaryEntryRepository.observeByDate(selectedDay),
    [selectedDay],
  );
  const entries = useObservable(entriesObservable, EMPTY_ENTRIES);

  const consumed = useMemo(() => calculateConsumedNutrition(entries), [entries]);

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

          {/* The hero needs the goal to compare against, so it waits for the profile rather
              than rendering a status pill against a goal the user never set. */}
          {profile ? (
            <JournalHeroCard
              day={selectedDay}
              consumedCalories={consumed.calories}
              dailyCalorieGoal={profile.dailyCalorieGoal}
            />
          ) : null}
        </Content>
      </ScrollView>
    </Safe>
  );
}
