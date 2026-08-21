import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddEntryScreen } from '@/features/journal/screens/AddEntryScreen';
import type { TodayStackParamList } from '@/navigation/types';

import { TodayScreen } from './screens/TodayScreen';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Today" component={TodayScreen} />
      {/* Same screen as the Journal stack's AddEntry route (KCAL-172): declared twice
          rather than hoisting a root-level modal stack. Modal per interactions.md. */}
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
