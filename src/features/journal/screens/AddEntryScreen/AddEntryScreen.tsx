import type { JournalAddEntryScreenProps } from '@/navigation/types';

import { Container } from './AddEntryScreen.styles';

/**
 * Registered in both the Today and Journal stacks (KCAL-172). Typed against the Journal
 * stack's props: the route params are identical in both, so it works unchanged either way.
 *
 * Layout, header and the EntryFilterBar/EntryResultList subfolders land in KCAL-173.
 */
export function AddEntryScreen(_props: JournalAddEntryScreenProps) {
  return <Container />;
}
