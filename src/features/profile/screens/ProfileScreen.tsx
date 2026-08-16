import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

import Text from '@/ui/Text';

const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

export function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <Container>
      <Text variant="h2">{t('tabs.profile')}</Text>
    </Container>
  );
}
