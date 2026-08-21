import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Food } from '@/domain/types';
import Card from '@/ui/Card';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { CardActions, CardRow, styles } from './FoodListItem.styles';
import { foodKcalLabel } from './FoodListItem.helpers';

export type FoodListItemProps = {
  food: Food;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDeletePress: () => void;
};

/**
 * KCAL-106 — Card light item: tap navigates to the edit form, tap ★ toggles
 * favorite inline, tap the trash icon opens the delete confirmation (KCAL-119).
 * Nested Pressables: RN's touch responder system routes a tap to the
 * innermost Pressable under the finger, so the star/trash taps never also
 * trigger the outer card's onPress.
 */
export function FoodListItem({
  food,
  onPress,
  onToggleFavorite,
  onDeletePress,
}: FoodListItemProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <Pressable accessibilityRole="button" testID={`library.foodCard.${food.id}`} onPress={onPress}>
      <Card tone="light">
        <CardRow>
          <View style={styles.nameColumn}>
            <Text variant="body" color="text.primary">
              {food.name}
            </Text>
            <Text variant="caption" color="text.tertiary" style={styles.kcalLabel}>
              {foodKcalLabel(t, food)}
            </Text>
          </View>

          <CardActions>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                food.isFavorite
                  ? t('library.food.removeFavorite', { name: food.name })
                  : t('library.food.addFavorite', { name: food.name })
              }
              accessibilityState={{ selected: food.isFavorite }}
              hitSlop={10}
              testID={`library.foodCard.${food.id}.favorite`}
              onPress={onToggleFavorite}
            >
              <Ionicons
                name={food.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={food.isFavorite ? theme.colors.azure[400] : theme.colors.text.disabled}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.food.deleteLabel', { name: food.name })}
              hitSlop={10}
              testID={`library.foodCard.${food.id}.delete`}
              onPress={onDeletePress}
            >
              <Ionicons name="trash-outline" size={19} color={theme.colors.text.tertiary} />
            </Pressable>
          </CardActions>
        </CardRow>
      </Card>
    </Pressable>
  );
}

export default FoodListItem;
