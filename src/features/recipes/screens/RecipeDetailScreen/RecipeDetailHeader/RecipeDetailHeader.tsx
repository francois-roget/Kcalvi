import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';

import Button from '@/ui/Button';
import type { Theme } from '@/ui/theme';

import { HeaderRow } from './RecipeDetailHeader.styles';

export type RecipeDetailHeaderProps = {
  onBackPress: () => void;
  onEditPress: () => void;
};

/** Top bar: back chevron + "Modifier" ghost button (KCAL-138). */
export function RecipeDetailHeader({ onBackPress, onEditPress }: RecipeDetailHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <HeaderRow>
      <Pressable
        testID="recipeDetail.header.back"
        accessibilityRole="button"
        accessibilityLabel={t('recipeDetail.header.backLabel')}
        hitSlop={12}
        onPress={onBackPress}
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
      </Pressable>
      <Button
        testID="recipeDetail.header.edit"
        label={t('recipeDetail.header.edit')}
        variant="ghost"
        size="md"
        onPress={onEditPress}
      />
    </HeaderRow>
  );
}

export default RecipeDetailHeader;
