import { styled } from 'styled-components/native';

export const Container = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
