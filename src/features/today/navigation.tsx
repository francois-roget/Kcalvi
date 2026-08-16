import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { TodayStackParamList } from '@/navigation/types';

import { TodayScreen } from './screens/TodayScreen';

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Today" component={TodayScreen} />
    </Stack.Navigator>
  );
}
