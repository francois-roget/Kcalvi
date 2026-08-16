import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

import type { ProgressScreenProps } from '@/navigation/types';
import Text from '@/ui/Text';

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.sand[100]};
  gap: ${({ theme }) => theme.spacing[5]}px;
`;

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
