import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { OnboardingStackParamList } from '@/navigation/types';

import { GoalSetupScreen } from './screens/GoalSetupScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
    </Stack.Navigator>
  );
}
