import { useTranslation } from 'react-i18next';

import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { Container } from './EntryEmptyState.styles';

export type EntryEmptyStateProps = {
  /** The (trimmed) search term that matched nothing; empty when no search is in progress. */
  query: string;
  onCreatePress: () => void;
};

/**
 * "Aucun résultat" + "Créer cet aliment" (2h). The create CTA only appears once there is a
 * search term to hand off as the new food's name -- with an empty query it would be an
 * unlabelled create button duplicating the header's « Créer ».
 */
export function EntryEmptyState({ query, onCreatePress }: EntryEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <Container>
      <Text variant="body" color="text.secondary">
        {query === ''
          ? t('addEntry.empty.noResults')
          : t('addEntry.empty.noResultsForQuery', { query })}
      </Text>

      {query === '' ? null : (
        <Button
          testID="addEntry.empty.create"
          label={t('addEntry.empty.createFood')}
          variant="primary"
          onPress={onCreatePress}
        />
      )}
    </Container>
  );
}

export default EntryEmptyState;
