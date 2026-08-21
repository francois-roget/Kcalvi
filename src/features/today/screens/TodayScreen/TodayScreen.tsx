import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { profileRepository } from '@/data/repositories';
import { useObservable } from '@/hooks/useObservable';
import Text from '@/ui/Text';

import { Header, Safe } from './TodayScreen.styles';

export function TodayScreen() {
  const { t } = useTranslation();
  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable(profileObservable, null);

  return (
    <Safe edges={['top', 'bottom']}>
      <Header>
        {/* `today.greeting` is the smoke test's anchor: it only renders once the profile
            observable has emitted, so asserting on it proves the data layer resolved, not just
            that the tab bar mounted (see .maestro/smoke.yaml). */}
        {profile ? (
          <Text testID="today.greeting" variant="h2">
            {t('today.greeting', { name: profile.name })}
          </Text>
        ) : null}
      </Header>
    </Safe>
  );
}
