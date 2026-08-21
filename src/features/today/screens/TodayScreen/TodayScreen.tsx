import { useMemo } from 'react';

import { diaryEntryRepository, profileRepository } from '@/data/repositories';
import type { DiaryEntry } from '@/domain/types';
import { TodayHeader } from '@/features/today/components/TodayHeader';
import { useObservable } from '@/hooks/useObservable';

import { Content, Safe } from './TodayScreen.styles';
import { TodayHeroCard } from './TodayHeroCard';

const EMPTY_ENTRIES: DiaryEntry[] = [];

export function TodayScreen() {
  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable(profileObservable, null);

  // Resolved once per mount rather than per render: the journal day only rolls over at local
  // midnight (TECHNICAL_SPECS §8.1), so a fresh Date on every render would be churn -- and it
  // would rebuild the observed query below on every render too.
  const today = useMemo(() => new Date(), []);

  const entriesObservable = useMemo(() => diaryEntryRepository.observeByDate(today), [today]);
  const entries = useObservable(entriesObservable, EMPTY_ENTRIES);

  return (
    <Safe edges={['top', 'bottom']}>
      <TodayHeader name={profile?.name ?? null} date={today} />

      <Content>
        {/* The hero needs the goal to draw the gauge, so it waits for the profile rather than
            rendering against a placeholder goal the user never set. */}
        {profile ? (
          <TodayHeroCard entries={entries} dailyCalorieGoal={profile.dailyCalorieGoal} />
        ) : null}
      </Content>
    </Safe>
  );
}
