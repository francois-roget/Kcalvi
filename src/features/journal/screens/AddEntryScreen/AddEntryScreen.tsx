import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useState } from 'react';

import {
  QuantitySheet,
  type QuantitySheetTarget,
} from '@/features/journal/components/QuantitySheet';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRecipeCalories } from '@/hooks/useRecipeCalories';
import type { JournalAddEntryScreenProps, RootTabParamList } from '@/navigation/types';

import { AddEntryHeader } from './AddEntryHeader';
import {
  DEFAULT_ENTRY_FILTER,
  navigateToFoodForm,
  useAddEntryResults,
  useEntryResults,
  type EntryFilterKey,
} from './AddEntryScreen.helpers';
import { Content, Safe } from './AddEntryScreen.styles';
import { EntryEmptyState } from './EntryEmptyState';
import { EntryFilterBar } from './EntryFilterBar';
import { EntryResultList } from './EntryResultList';

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

  const { filteredFoods, filteredRecipes } = useAddEntryResults(debouncedQuery, selectedFilter);
  const recipeCalories = useRecipeCalories(filteredRecipes);
  const results = useEntryResults(filteredFoods, filteredRecipes, recipeCalories);

  // `null` = sheet closed.
  const [sheetTarget, setSheetTarget] = useState<QuantitySheetTarget | null>(null);

  const trimmedQuery = debouncedQuery.trim();
  const openFoodForm = (initialName?: string) =>
    navigateToFoodForm(
      navigation.getParent<BottomTabNavigationProp<RootTabParamList>>(),
      initialName,
    );

  return (
    <Safe edges={['top', 'bottom']}>
      <AddEntryHeader
        mealType={mealType}
        onCancel={() => navigation.goBack()}
        onCreate={() => openFoodForm()}
      />

      <Content>
        <EntryFilterBar
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />

        {results.length === 0 ? (
          <EntryEmptyState query={trimmedQuery} onCreatePress={() => openFoodForm(trimmedQuery)} />
        ) : (
          <EntryResultList
            results={results}
            onSelect={(result) =>
              setSheetTarget(
                result.kind === 'food'
                  ? { kind: 'food', food: result.food }
                  : { kind: 'recipe', recipe: result.recipe },
              )
            }
          />
        )}
      </Content>

      {sheetTarget ? (
        <QuantitySheet visible target={sheetTarget} onClose={() => setSheetTarget(null)} />
      ) : null}
    </Safe>
  );
}
