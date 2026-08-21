import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ProgressScreenProps } from '@/navigation/types';
import Text from '@/ui/Text';

import { Container } from './ProgressScreen.styles';

export function ProgressScreen({ navigation }: ProgressScreenProps) {
  const { t } = useTranslation();

  return (
    <Container>
      <Text variant="h2">{t('tabs.progress')}</Text>
      <Pressable onPress={() => navigation.navigate('Profile')}>
        <Text variant="body" color="text.accent">
          {t('tabs.profile')}
        </Text>
      </Pressable>
    </Container>
  );
}
