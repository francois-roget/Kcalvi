import { useTranslation } from 'react-i18next';

import Chip from '@/ui/Chip';
import Text from '@/ui/Text';

import { formatRate, RATES } from './RateSelector.helpers';
import { ChipRow } from './RateSelector.styles';

export type RateSelectorProps = {
  weeklyRateKg: number;
  onSelectRate: (rate: number) => void;
};

export function RateSelector({ weeklyRateKg, onSelectRate }: RateSelectorProps) {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="title">{t('onboarding.goalSetup.rateLabel')}</Text>
      <ChipRow>
        {RATES.map((rate) => (
          <Chip
            key={rate}
            label={t('onboarding.goalSetup.rateChip', { rate: formatRate(rate) })}
            selected={weeklyRateKg === rate}
            onPress={() => onSelectRate(rate)}
          />
        ))}
      </ChipRow>
    </>
  );
}

export default RateSelector;
