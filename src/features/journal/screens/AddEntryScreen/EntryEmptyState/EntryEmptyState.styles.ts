import { styled } from 'styled-components/native';

export const Container = styled.View`
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[6]}px;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;
