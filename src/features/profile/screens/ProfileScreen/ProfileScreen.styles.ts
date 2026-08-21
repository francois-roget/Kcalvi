import { styled } from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[6]}px;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;
