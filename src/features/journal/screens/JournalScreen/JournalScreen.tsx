import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { diaryEntryRepository, profileRepository } from '@/data/repositories';
import { calculateConsumedNutrition } from '@/domain/calculations';
import { MEAL_TYPES, type DiaryEntry, type MealType } from '@/domain/types';
import { DayStrip } from '@/features/journal/components/DayStrip';
import { MealSection } from '@/features/journal/components/MealSection';
import { useEntriesByMeal } from '@/hooks/useEntriesByMeal';
import { useObservable } from '@/hooks/useObservable';
import type { JournalScreenProps } from '@/navigation/types';
import Text from '@/ui/Text';
import { formatKcal, formatMonthYear, toDayKey } from '@/utils/format';

import { EntryActionsSheet } from './EntryActionsSheet';
import { JournalHeroCard } from './JournalHeroCard';
import { useWeekDays } from './JournalScreen.helpers';
import { Container, Content, Header, HeaderRow, Safe, styles } from './JournalScreen.styles';

const EMPTY_ENTRIES: DiaryEntry[] = [];

export function JournalScreen({ navigation }: JournalScreenProps) {
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
  // One subscription per day, split in memory (KCAL-185's rule, shared hook since KCAL-189).
  const entriesByMeal = useEntriesByMeal(entries);

  // `null` closes the actions sheet (KCAL-191).
  const [entryUnderAction, setEntryUnderAction] = useState<DiaryEntry | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openEntryActions(entry: DiaryEntry) {
    setActionError(null);
    setEntryUnderAction(entry);
  }

  function closeEntryActions() {
    setEntryUnderAction(null);
    setActionError(null);
  }

  function openAddEntry(mealType: MealType) {
    navigation.navigate('AddEntry', { mealType, date: toDayKey(selectedDay) });
  }

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

          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={entriesByMeal[mealType]}
              onAddPress={() => openAddEntry(mealType)}
              onEntryPress={openEntryActions}
            />
          ))}

          {/* KCAL-190 — Activité is a placeholder: there is no ActivityRepository until
              Sprint 5, so the total is a literal 0 and the section is not interactive (2m
              doesn't exist either). Rendered rather than hidden so the screen's real shape is
              in place, with the footnote saying why it stays at zero. */}
          <Container testID="journal.activity">
            <HeaderRow>
              <Text variant="overline" color="text.tertiary">
                {t('journal.activity.title')}
              </Text>
              <Text variant="caption" color="text.disabled">
                {formatKcal(0)}
              </Text>
            </HeaderRow>
            <Text variant="caption" color="text.disabled">
              {t('journal.activity.comingSoon')}
            </Text>
          </Container>

          <Text variant="micro" color="text.quaternary" style={styles.footnote}>
            {t('journal.footnote')}
          </Text>
        </Content>
      </ScrollView>

      {/* The three actions land in KCAL-192 (quantity), KCAL-193 (meal) and KCAL-194
          (delete); the sheet and its failure surface are in place from here. */}
      <EntryActionsSheet
        entry={entryUnderAction}
        errorMessage={actionError}
        onClose={closeEntryActions}
        onEditQuantity={() => {}}
        onChangeMeal={() => {}}
        onDelete={() => {}}
      />
    </Safe>
  );
}
