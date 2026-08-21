import { useMemo } from 'react';

import { profileRepository } from '@/data/repositories';
import { TodayHeader } from '@/features/today/components/TodayHeader';
import { useObservable } from '@/hooks/useObservable';

import { Safe } from './TodayScreen.styles';

export function TodayScreen() {
  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable(profileObservable, null);

  // Resolved once per mount rather than per render: the journal day only rolls over at local
  // midnight (TECHNICAL_SPECS §8.1), so a fresh Date on every render would be churn.
  const today = useMemo(() => new Date(), []);

  return (
    <Safe edges={['top', 'bottom']}>
      <TodayHeader name={profile?.name ?? null} date={today} />
    </Safe>
  );
}
