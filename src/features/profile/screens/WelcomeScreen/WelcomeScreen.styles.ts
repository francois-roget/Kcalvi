import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import Text from '@/ui/Text';

export const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.ink[900]};
`;

export const Content = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

export const Mark = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 22px;
  overflow: hidden;
`;

export const FullImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

export const TitleText = styled(Text)`
  text-align: center;
`;

export const SubtitleText = styled(Text)`
  font-size: 15px;
  text-align: center;
  max-width: 280px;
`;

export const Bullets = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
  align-self: stretch;
`;

export const BulletRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const Dot = styled.View<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${({ $color }) => $color};
`;

export const FullWidth = styled.View`
  align-self: stretch;
`;

export const Footer = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-bottom: ${({ theme }) => theme.spacing[6]}px;
  gap: ${({ theme }) => theme.spacing[3]}px;
  align-items: center;
`;

export const CaptionText = styled(Text)`
  font-size: 12.5px;
`;
