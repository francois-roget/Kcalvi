import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import type { WelcomeScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.ink[900]};
`;

const Content = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

const Mark = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 22px;
  overflow: hidden;
`;

const Bullets = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
  align-self: stretch;
`;

const BulletRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const Dot = styled.View<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${({ $color }) => $color};
`;

const FullWidth = styled.View`
  align-self: stretch;
`;

const Footer = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-bottom: ${({ theme }) => theme.spacing[6]}px;
  gap: ${({ theme }) => theme.spacing[3]}px;
  align-items: center;
`;

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const bullets = [
    { key: 'steps', color: theme.colors.azure[400] },
    { key: 'weeklyBudget', color: theme.colors.terracotta[300] },
    { key: 'offline', color: theme.colors.olive[500] },
  ];

  return (
    <Safe edges={['top', 'bottom']}>
      <Content>
        <Mark>
          <Image
            source={require('../../../../assets/icon.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </Mark>
        <Text variant="display" color="onDark.primary" style={{ textAlign: 'center' }}>
          {t('onboarding.welcome.title')}
        </Text>
        <Text
          variant="body"
          color="onDark.muted"
          style={{ fontSize: 15, textAlign: 'center', maxWidth: 280 }}
        >
          {t('onboarding.welcome.subtitle')}
        </Text>
        <Bullets>
          {bullets.map((bullet) => (
            <BulletRow key={bullet.key}>
              <Dot $color={bullet.color} />
              <Text variant="bodySm" color="onDark.muted">
                {t(`onboarding.welcome.bullets.${bullet.key}`)}
              </Text>
            </BulletRow>
          ))}
        </Bullets>
      </Content>
      <Footer>
        <FullWidth>
          <Button
            testID="onboarding.welcome.cta"
            label={t('onboarding.welcome.cta')}
            variant="onDark"
            onPress={() => navigation.navigate('ProfileSetup')}
          />
        </FullWidth>
        <Text variant="caption" color="onDark.subtle" style={{ fontSize: 12.5 }}>
          {t('onboarding.welcome.dataNotice')}
        </Text>
      </Footer>
    </Safe>
  );
}

export default WelcomeScreen;
