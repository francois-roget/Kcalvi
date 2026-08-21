import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import Button from '@/ui/Button';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { CenteredContent, EmptyActions, EmptyIconSquare, styles } from './LibraryEmptyState.styles';

export type LibraryEmptyStateProps = { onCreatePress: () => void };

/** KCAL-108 — empty-library state (screen 2s). */
export function LibraryEmptyState({ onCreatePress }: LibraryEmptyStateProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <CenteredContent>
      <EmptyIconSquare>
        <Ionicons name="nutrition-outline" size={28} color={theme.colors.azure[600]} />
      </EmptyIconSquare>

      <Text color="text.primary" style={styles.title}>
        {t('library.empty.title')}
      </Text>
      <Text variant="bodySm" color="text.tertiary" style={styles.subtitle}>
        {t('library.empty.subtitle')}
      </Text>

      <EmptyActions>
        <Button
          label={t('library.empty.primaryCta')}
          variant="primary"
          testID="library.empty.primaryCta"
          onPress={onCreatePress}
        />
        {/* Decided (SPRINT1-DETAILS.MD, KCAL-108): seed data is an open point
            (TECHNICAL_SPECS.MD §20) — the button is shown but not wired this
            sprint. */}
        <Button
          label={t('library.empty.secondaryCta')}
          variant="secondary"
          disabled
          accessibilityHint={t('library.empty.secondaryCtaHint')}
        />
      </EmptyActions>
    </CenteredContent>
  );
}

export default LibraryEmptyState;
