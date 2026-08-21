import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { LibraryScreenProps } from '@/navigation/types';

import { LibraryDialogs } from './LibraryDialogs';
import { LibraryEmptyState } from './LibraryEmptyState';
import { LibraryHeader } from './LibraryHeader';
import {
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
  useFoodDeleteFlow,
  useLibraryActions,
  useLibraryLists,
  useRecipeArchiveFlow,
  useRecipeCalories,
  type FilterKey,
} from './LibraryScreen.helpers';
import { Content, Safe, styles } from './LibraryScreen.styles';
import { LibrarySections } from './LibrarySections';
import { LibrarySummary } from './LibrarySummary';
import { SearchFilterBar } from './SearchFilterBar';

export function LibraryScreen({ navigation }: LibraryScreenProps) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const {
    recipes,
    filteredFoods,
    filteredRecipes,
    counts,
    isLibraryEmpty,
    showRecipesSection,
    showFoodsSection,
    showGlobalNoResults,
  } = useLibraryLists(debouncedQuery, selectedFilter);

  const recipeCalories = useRecipeCalories(recipes);
  const deleteFlow = useFoodDeleteFlow(t);
  const archiveFlow = useRecipeArchiveFlow(t);
  const actions = useLibraryActions(navigation);

  if (isLibraryEmpty) {
    return (
      <Safe edges={['top', 'bottom']}>
        <Content style={styles.emptyContent}>
          <LibraryHeader />
          <LibraryEmptyState onCreatePress={actions.handleCreatePress} />
        </Content>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Content>
          <LibraryHeader onAddPress={actions.handleCreatePress} />

          <SearchFilterBar
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            onClearSearch={() => setSearchQuery('')}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
          />

          <LibrarySummary counts={counts} />

          <LibrarySections
            debouncedQuery={debouncedQuery}
            showGlobalNoResults={showGlobalNoResults}
            showRecipesSection={showRecipesSection}
            showFoodsSection={showFoodsSection}
            filteredRecipes={filteredRecipes}
            filteredFoods={filteredFoods}
            recipeCalories={recipeCalories}
            actions={actions}
            onArchiveRecipePress={archiveFlow.openArchiveDialog}
            onDeleteFoodPress={deleteFlow.openDeleteDialog}
          />
        </Content>
      </ScrollView>

      <LibraryDialogs deleteFlow={deleteFlow} archiveFlow={archiveFlow} />
    </Safe>
  );
}

export default LibraryScreen;
