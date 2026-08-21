import styled from 'styled-components/native';

export const HeroPortionRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[3]}px;
`;

export const MacrosColumn = styled.View`
  align-items: flex-end;
  gap: 3px;
`;
