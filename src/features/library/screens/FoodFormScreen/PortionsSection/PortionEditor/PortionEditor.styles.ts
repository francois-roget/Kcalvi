import styled from 'styled-components/native';

export const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

export const MarginTopRow = styled(Row)`
  margin-top: 12px;
`;

export const FieldGroup = styled.View`
  flex: 1;
`;

export const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;
