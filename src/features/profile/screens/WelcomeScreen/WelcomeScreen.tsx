import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { WelcomeScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import {
  Bullets,
  BulletRow,
  CaptionText,
  Content,
  Dot,
  Footer,
  FullImage,
  FullWidth,
  Mark,
  Safe,
  SubtitleText,
  TitleText,
} from './WelcomeScreen.styles';

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
          <FullImage source={require('../../../../../assets/icon.png')} resizeMode="cover" />
        </Mark>
        <TitleText variant="display" color="onDark.primary">
          {t('onboarding.welcome.title')}
        </TitleText>
        <SubtitleText variant="body" color="onDark.muted">
          {t('onboarding.welcome.subtitle')}
        </SubtitleText>
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
        <CaptionText variant="caption" color="onDark.subtle">
          {t('onboarding.welcome.dataNotice')}
        </CaptionText>
      </Footer>
    </Safe>
  );
}

export default WelcomeScreen;
