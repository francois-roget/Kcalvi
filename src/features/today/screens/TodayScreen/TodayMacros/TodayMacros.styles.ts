import { styled } from 'styled-components/native';

export const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[2]}px;
`;
