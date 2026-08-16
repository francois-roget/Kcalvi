import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { JournalStackParamList } from '@/navigation/types';

import { JournalScreen } from './screens/JournalScreen';

const Stack = createNativeStackNavigator<JournalStackParamList>();

export function JournalNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Journal" component={JournalScreen} />
    </Stack.Navigator>
  );
}
