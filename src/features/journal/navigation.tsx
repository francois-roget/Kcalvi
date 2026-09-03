import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { JournalStackParamList } from '@/navigation/types';

import { AddEntryScreen } from './screens/AddEntryScreen';
import { JournalScreen } from './screens/JournalScreen';

const Stack = createNativeStackNavigator<JournalStackParamList>();

export function JournalNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Journal" component={JournalScreen} />
      {/* Modal presentation per interactions.md; the screen draws its own
          Annuler / titre / action header (KCAL-173). */}
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
