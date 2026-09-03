import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'styled-components/native';

export const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

/**
 * The result list (KCAL-175) scrolls on its own inside this container, so unlike
 * FoodFormScreen there is no ScrollView wrapping the whole screen -- a FlatList nested in a
 * ScrollView loses virtualization and warns at runtime.
 */
export const Content = styled.View`
  flex: 1;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;
