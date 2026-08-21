import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ScrollView } from 'react-native';
import { useMemo } from 'react';

import { diaryEntryRepository, profileRepository } from '@/data/repositories';
import { calculateConsumedNutrition } from '@/domain/calculations';
import type { DiaryEntry, MealType } from '@/domain/types';
import { TodayHeader } from '@/features/today/components/TodayHeader';
import { useObservable } from '@/hooks/useObservable';
import type { RootTabParamList, TodayScreenProps } from '@/navigation/types';
import { toDayKey } from '@/utils/format';

import { TodayHeroCard } from './TodayHeroCard';
import { TodayMacros } from './TodayMacros';
import { TodayMeals } from './TodayMeals';
import { useEntriesByMeal } from './TodayScreen.helpers';
import { Content, Safe, styles } from './TodayScreen.styles';

const EMPTY_ENTRIES: DiaryEntry[] = [];

export function TodayScreen({ navigation }: TodayScreenProps) {
  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable(profileObservable, null);

  // Resolved once per mount rather than per render: the journal day only rolls over at local
  // midnight (TECHNICAL_SPECS §8.1), so a fresh Date on every render would be churn -- and it
  // would rebuild the observed query below on every render too.
  const today = useMemo(() => new Date(), []);

  // KCAL-185: one subscription for the whole screen. The meal cards get their slice from
  // `useEntriesByMeal` in memory, never from four separate observed queries.
  const entriesObservable = useMemo(() => diaryEntryRepository.observeByDate(today), [today]);
  const entries = useObservable(entriesObservable, EMPTY_ENTRIES);
  const entriesByMeal = useEntriesByMeal(entries);

  // Aggregated once for the whole screen (KCAL-184): the hero and the macro cards read the
  // same totals instead of each reducing the day's entries themselves -- interactions.md
  // forbids the UI from adding up kcal or macros at all.
  const consumed = useMemo(() => calculateConsumedNutrition(entries), [entries]);
  const isEmptyDay = entries.length === 0;

  function openAddEntry(mealType: MealType) {
    navigation.navigate('AddEntry', { mealType, date: toDayKey(today) });
  }

  function openJournal() {
    // « Tout voir » switches tabs rather than pushing inside this stack (interactions.md's
    // navigation map): the Journal is a sibling tab, not a Today sub-screen.
    navigation
      .getParent<BottomTabNavigationProp<RootTabParamList>>()
      ?.navigate('JournalTab', { screen: 'Journal' });
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TodayHeader name={profile?.name ?? null} date={today} />

        <Content>
          {/* The hero needs the goal to draw the gauge, so it waits for the profile rather than
              rendering against a placeholder goal the user never set. */}
          {profile ? (
            <>
              <TodayHeroCard
                consumed={consumed}
                dailyCalorieGoal={profile.dailyCalorieGoal}
                isEmptyDay={isEmptyDay}
              />
              <TodayMacros consumed={consumed} profile={profile} />
            </>
          ) : null}

          <TodayMeals
            entriesByMeal={entriesByMeal}
            onMealPress={openAddEntry}
            onSeeAllPress={openJournal}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}
