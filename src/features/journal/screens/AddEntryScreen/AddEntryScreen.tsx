import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { JournalAddEntryScreenProps, RootTabParamList } from '@/navigation/types';

import { AddEntryHeader } from './AddEntryHeader';
import { navigateToFoodForm } from './AddEntryScreen.helpers';
import { Content, Safe } from './AddEntryScreen.styles';

/**
 * Quick-add screen (2h), registered in both the Today and Journal stacks (KCAL-172). Typed
 * against the Journal stack's props: the route params are identical in both, so it works
 * unchanged either way.
 *
 * This ticket (KCAL-173) lays out the shell and the header. The SearchField and filter chips
 * (EntryFilterBar, KCAL-174), the results FlatList (EntryResultList/EntryResultItem,
 * KCAL-175) and the empty state (KCAL-176) slot into Content below.
 */
export function AddEntryScreen({ route, navigation }: JournalAddEntryScreenProps) {
  const { mealType } = route.params;

  return (
    <Safe edges={['top', 'bottom']}>
      <AddEntryHeader
        mealType={mealType}
        onCancel={() => navigation.goBack()}
        onCreate={() =>
          navigateToFoodForm(navigation.getParent<BottomTabNavigationProp<RootTabParamList>>())
        }
      />

      <Content />
    </Safe>
  );
}
