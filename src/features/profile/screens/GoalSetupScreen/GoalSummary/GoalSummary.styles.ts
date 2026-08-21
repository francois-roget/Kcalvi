import type { TextStyle } from 'react-native';
import styled from 'styled-components/native';

export const StatRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const InfoBox = styled.View`
  background-color: ${({ theme }) => theme.colors.azure[50]};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border.info};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  padding: ${({ theme }) => theme.spacing[4]}px;
`;

export const heroValueStyle: TextStyle = { marginTop: 4 };
