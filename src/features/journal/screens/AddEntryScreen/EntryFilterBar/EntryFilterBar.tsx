import { useTranslation } from 'react-i18next';

import Chip from '@/ui/Chip';
import SearchField from '@/ui/SearchField';

import { ENTRY_FILTERS, type EntryFilterKey } from '../AddEntryScreen.helpers';
import { ChipRow } from './EntryFilterBar.styles';

export type EntryFilterBarProps = {
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  selectedFilter: EntryFilterKey;
  onSelectFilter: (filter: EntryFilterKey) => void;
};

/** Search field (debounced by the caller) + quick filter chips (KCAL-174). */
export function EntryFilterBar({
  searchQuery,
  onChangeSearchQuery,
  onClearSearch,
  selectedFilter,
  onSelectFilter,
}: EntryFilterBarProps) {
  const { t } = useTranslation();

  return (
    <>
      <SearchField
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        onClear={onClearSearch}
        placeholder={t('addEntry.searchPlaceholder')}
        accessibilityLabel={t('addEntry.searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        testID="addEntry.searchField"
      />

      <ChipRow>
        {ENTRY_FILTERS.map((filter) => (
          <Chip
            key={filter}
            label={t(`addEntry.filters.${filter}`)}
            selected={selectedFilter === filter}
            testID={`addEntry.filter.${filter}`}
            onPress={() => onSelectFilter(filter)}
          />
        ))}
      </ChipRow>
    </>
  );
}

export default EntryFilterBar;
