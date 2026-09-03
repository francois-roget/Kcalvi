import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const CardRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const styles = StyleSheet.create({
  titleColumn: { flexShrink: 1, paddingRight: 12 },
  summary: { marginTop: 2 },
  // The kcal total never wraps or shrinks: the summary line is what gives way when the
  // entry names are long.
  kcal: { flexShrink: 0 },
});
