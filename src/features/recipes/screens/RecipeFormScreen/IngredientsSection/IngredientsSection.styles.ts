import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

export const SectionBlock = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const styles = StyleSheet.create({
  addLabel: { textAlign: 'center' },
});
