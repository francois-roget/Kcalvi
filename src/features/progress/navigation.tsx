import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import type { ProgressStackParamList } from '@/navigation/types';

import { ProgressScreen } from './screens/ProgressScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Progress" options={{ headerShown: false }} component={ProgressScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
