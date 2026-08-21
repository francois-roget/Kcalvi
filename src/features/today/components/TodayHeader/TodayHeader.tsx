import { useTranslation } from 'react-i18next';

import Text from '@/ui/Text';
import { formatLongDate } from '@/utils/format';

import { Container, styles } from './TodayHeader.styles';

export type TodayHeaderProps = {
  /** `null` while the profile observable hasn't emitted yet. */
  name: string | null;
  date: Date;
};

/**
 * Today's greeting + date (2a).
 *
 * The design also shows a terracotta streak badge (« 5 jours ») next to the greeting; it is
 * deliberately absent here, since streaks are F23 / Sprint 7. Nothing is stubbed for it -- an
 * empty placeholder would just be dead layout until then.
 */
export function TodayHeader({ name, date }: TodayHeaderProps) {
  const { t } = useTranslation();

  return (
    <Container>
      {/* `today.greeting` is the smoke test's anchor: it only renders once the profile
          observable has emitted, so asserting on it proves the data layer resolved, not just
          that the tab bar mounted (see .maestro/smoke.yaml). */}
      {name === null ? null : (
        <Text testID="today.greeting" variant="h2">
          {t('today.greeting', { name })}
        </Text>
      )}

      <Text variant="overline" color="text.tertiary" style={styles.date} testID="today.date">
        {formatLongDate(date)}
      </Text>
    </Container>
  );
}

export default TodayHeader;
