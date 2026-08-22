import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { calculateConsumedCalories } from '@/domain/calculations';
import type { DiaryEntry, MealType } from '@/domain/types';
import Card from '@/ui/Card';
import Text from '@/ui/Text';
import { formatKcal } from '@/utils/format';

import { CardRow, styles } from './MealCard.styles';

export type MealCardProps = {
  mealType: MealType;
  /** This meal's slice of the day, already filtered by the caller from one observed query. */
  entries: DiaryEntry[];
  onPress: () => void;
};

/**
 * One meal row of 2a's « Repas » section: name, a summary of what was logged, and the meal's
 * kcal total. Empty meals still render (the design shows dinner empty) and stay tappable --
 * tapping is how the user adds to them.
 *
 * The summary reads `entry.label`, the name frozen at write time (RM16), so a food renamed or
 * deleted since doesn't blank out or change the journal.
 */
export function MealCard({ mealType, entries, onPress }: MealCardProps) {
  const { t } = useTranslation();

  const isEmpty = entries.length === 0;
  // RM04 on this meal's slice -- the card doesn't sum anything itself.
  const calories = calculateConsumedCalories(entries);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('today.meals.addTo', { meal: t(`meals.${mealType}`) })}
      testID={`today.mealCard.${mealType}`}
      onPress={onPress}
    >
      <Card tone="light">
        <CardRow>
          <View style={styles.titleColumn}>
            <Text variant="body" color="text.primary">
              {t(`meals.${mealType}`)}
            </Text>
            <Text
              variant="caption"
              color={isEmpty ? 'text.disabled' : 'text.tertiary'}
              style={styles.summary}
              numberOfLines={1}
            >
              {isEmpty ? t('today.meals.empty') : entries.map((entry) => entry.label).join(', ')}
            </Text>
          </View>

          {/* An empty meal shows nothing rather than "0 kcal": a zero total would read as a
              logged value, which is exactly what the empty summary is saying it isn't. */}
          {isEmpty ? null : (
            <Text variant="body" color="text.primary" style={styles.kcal} numberOfLines={1}>
              {formatKcal(calories)}
            </Text>
          )}
        </CardRow>
      </Card>
    </Pressable>
  );
}

export default MealCard;
