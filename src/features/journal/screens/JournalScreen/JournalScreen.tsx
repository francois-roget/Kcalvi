import { useTranslation } from 'react-i18next';

import Text from '@/ui/Text';

import { Container } from './JournalScreen.styles';

export function JournalScreen() {
  const { t } = useTranslation();

  return (
    <Container>
      <Text variant="h2">{t('tabs.journal')}</Text>
    </Container>
  );
}
