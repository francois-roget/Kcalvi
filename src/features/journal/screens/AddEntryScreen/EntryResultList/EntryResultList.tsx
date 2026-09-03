import { useCallback } from 'react';
import { FlatList, type ListRenderItem } from 'react-native';

import type { EntryResult } from '../AddEntryScreen.helpers';
import { EntryResultItem } from '../EntryResultItem';
import { styles } from './EntryResultList.styles';

export type EntryResultListProps = {
  results: EntryResult[];
  onSelect: (result: EntryResult) => void;
};

/** Results FlatList (2h). Scrolls on its own — never nest it in a ScrollView. */
export function EntryResultList({ results, onSelect }: EntryResultListProps) {
  const renderItem = useCallback<ListRenderItem<EntryResult>>(
    ({ item }) => <EntryResultItem result={item} onPress={() => onSelect(item)} />,
    [onSelect],
  );

  return (
    <FlatList
      data={results}
      // Foods and recipes share one list, and their ids come from different tables, so the key
      // is prefixed by kind rather than using the raw id.
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      testID="addEntry.resultList"
    />
  );
}

export default EntryResultList;
