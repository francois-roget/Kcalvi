import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import styled from 'styled-components/native';

import { profileRepository } from '@/data/repositories';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[6]}px;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

export function ProfileScreen() {
  const { t } = useTranslation();

  function handleResetPress() {
    Alert.alert(t('profile.resetConfirmTitle'), t('profile.resetConfirmMessage'), [
      { text: t('profile.resetConfirmCancel'), style: 'cancel' },
      {
        text: t('profile.resetConfirmConfirm'),
        style: 'destructive',
        onPress: () => profileRepository.reset(),
      },
    ]);
  }

  return (
    <Container>
      <Text variant="h2">{t('tabs.profile')}</Text>
      <Button label={t('profile.resetButton')} variant="secondary" onPress={handleResetPress} />
    </Container>
  );
}
