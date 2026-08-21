import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import HeroCard from '@/ui/HeroCard';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatInteger } from '@/utils/format';

import {
  getFavoriteStatStyle,
  getRecipeStatStyle,
  HeroColumn,
  HeroDivider,
  HeroRow,
} from './LibrarySummary.styles';

export type LibrarySummaryProps = {
  counts: { foods: number; recipes: number; favorites: number };
};

/**
 * KCAL-105/143 — unfiltered library counts (foods / recipes / favorites), deliberately NOT
 * affected by the active quick filter chip (KCAL-157): the hero always reflects the real
 * library content.
 */
export function LibrarySummary({ counts }: LibrarySummaryProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <HeroCard>
      <HeroRow>
        <HeroColumn>
          <Text variant="stat" color="onDark.primary">
            {formatInteger(counts.foods)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('library.hero.foods')}
          </Text>
        </HeroColumn>

        <HeroDivider />

        <HeroColumn>
          <Text variant="stat" style={getRecipeStatStyle(theme)}>
            {formatInteger(counts.recipes)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('library.hero.recipes')}
          </Text>
        </HeroColumn>

        <HeroDivider />

        <HeroColumn>
          <Text variant="stat" style={getFavoriteStatStyle(theme)}>
            {formatInteger(counts.favorites)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('library.hero.favorites')}
          </Text>
        </HeroColumn>
      </HeroRow>
    </HeroCard>
  );
}

export default LibrarySummary;
