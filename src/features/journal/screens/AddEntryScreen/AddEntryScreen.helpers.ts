import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { RootTabParamList } from '@/navigation/types';

/**
 * FoodFormScreen lives in the Library stack, while AddEntry is registered in the Today and
 * Journal stacks (KCAL-172), so « Créer » has to hop tabs through the parent tab navigator.
 * Typed via getParent's type argument: the stack's own `navigate` only knows its own routes.
 */
export function navigateToFoodForm(
  parent: BottomTabNavigationProp<RootTabParamList> | undefined,
): void {
  parent?.navigate('LibraryTab', { screen: 'FoodForm' });
}

// Turning `route.params.date` (a yyyy-MM-dd day key, KCAL-172) back into a Date belongs with
// the write path (KCAL-181), so it isn't here yet. Use date-fns `parseISO`, never
// `new Date('2026-08-21')`: the latter parses a date-only string as UTC and lands on the
// previous day for any device west of Greenwich.
