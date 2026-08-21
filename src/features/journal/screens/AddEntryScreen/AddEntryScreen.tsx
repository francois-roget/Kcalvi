import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useState } from 'react';

import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { JournalAddEntryScreenProps, RootTabParamList } from '@/navigation/types';

import { AddEntryHeader } from './AddEntryHeader';
import {
  DEFAULT_ENTRY_FILTER,
  navigateToFoodForm,
  useAddEntryResults,
  type EntryFilterKey,
} from './AddEntryScreen.helpers';
import { Content, Safe } from './AddEntryScreen.styles';
import { EntryFilterBar } from './EntryFilterBar';

/**
 * Quick-add screen (2h), registered in both the Today and Journal stacks (KCAL-172). Typed
 * against the Journal stack's props: the route params are identical in both, so it works
 * unchanged either way.
 *
 * The results FlatList (EntryResultList/EntryResultItem, KCAL-175) and the empty state
 * (KCAL-176) slot into Content below the filter bar.
 */
export function AddEntryScreen({ route, navigation }: JournalAddEntryScreenProps) {
  const { mealType } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<EntryFilterKey>(DEFAULT_ENTRY_FILTER);
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // Subscribed here so the search/chip wiring is live and observable-driven from this ticket
  // on; the returned lists get rendered by EntryResultList in KCAL-175.
  useAddEntryResults(debouncedQuery, selectedFilter);

  return (
    <Safe edges={['top', 'bottom']}>
      <AddEntryHeader
        mealType={mealType}
        onCancel={() => navigation.goBack()}
        onCreate={() =>
          navigateToFoodForm(navigation.getParent<BottomTabNavigationProp<RootTabParamList>>())
        }
      />

      <Content>
        <EntryFilterBar
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />
      </Content>
    </Safe>
  );
}
