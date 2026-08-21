import { useTranslation } from 'react-i18next';

import Chip from '@/ui/Chip';
import SearchField from '@/ui/SearchField';

import { FILTERS, type FilterKey } from '../LibraryScreen.helpers';
import { ChipRow } from './SearchFilterBar.styles';

export type SearchFilterBarProps = {
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  selectedFilter: FilterKey;
  onSelectFilter: (filter: FilterKey) => void;
};

/** Search field (KCAL-103, debounced by the caller) + quick filter chips (KCAL-104/143). */
export function SearchFilterBar({
  searchQuery,
  onChangeSearchQuery,
  onClearSearch,
  selectedFilter,
  onSelectFilter,
}: SearchFilterBarProps) {
  const { t } = useTranslation();

  return (
    <>
      <SearchField
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        onClear={onClearSearch}
        placeholder={t('library.searchPlaceholder')}
        accessibilityLabel={t('library.searchPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        testID="library.searchField"
      />

      <ChipRow>
        {FILTERS.map((filter) => (
          <Chip
            key={filter}
            label={t(`library.filters.${filter}`)}
            selected={selectedFilter === filter}
            testID={`library.filter.${filter}`}
            onPress={() => onSelectFilter(filter)}
          />
        ))}
      </ChipRow>
    </>
  );
}

export default SearchFilterBar;
