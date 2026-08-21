import { useTranslation } from 'react-i18next';

import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { createResetPressHandler } from './ProfileScreen.helpers';
import { Container } from './ProfileScreen.styles';

export function ProfileScreen() {
  const { t } = useTranslation();
  const handleResetPress = createResetPressHandler(t);

  return (
    <Container>
      <Text variant="h2">{t('tabs.profile')}</Text>
      <Button label={t('profile.resetButton')} variant="secondary" onPress={handleResetPress} />
    </Container>
  );
}
