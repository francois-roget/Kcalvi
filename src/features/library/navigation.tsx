import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { LibraryStackParamList } from '@/navigation/types';

import { FoodFormScreen } from './screens/FoodFormScreen';
import { LibraryScreen } from './screens/LibraryScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="FoodForm" component={FoodFormScreen} />
    </Stack.Navigator>
  );
}
