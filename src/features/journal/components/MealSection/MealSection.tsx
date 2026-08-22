import { useTranslation } from 'react-i18next';

import { calculateConsumedCalories } from '@/domain/calculations';
import type { DiaryEntry, MealType } from '@/domain/types';
import Button from '@/ui/Button';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import Text from '@/ui/Text';
import { formatKcal, unitLabel } from '@/utils/format';

import { Container, HeaderRow, styles } from './MealSection.styles';

export type MealSectionProps = {
  mealType: MealType;
  /** This meal's slice of the selected day, filtered in memory by the screen. */
  entries: DiaryEntry[];
  onAddPress: () => void;
  onEntryPress: (entry: DiaryEntry) => void;
};

/**
 * One meal block of 2b: an overline title with the meal's total on the right, the entries as a
 * ListCard, and a « + Ajouter » action.
 *
 * Rows read `entry.label` and `entry.unit`, both frozen at write time (RM16), so a food renamed
 * or deleted since still displays exactly what was logged. A 'portion' unit reaches
 * `unitLabel` unmapped and falls back to the raw code, which reads correctly for recipes.
 */
export function MealSection({ mealType, entries, onAddPress, onEntryPress }: MealSectionProps) {
  const { t } = useTranslation();

  const isEmpty = entries.length === 0;
  const calories = calculateConsumedCalories(entries);

  return (
    <Container testID={`journal.mealSection.${mealType}`}>
      <HeaderRow>
        <Text variant="overline" color="text.tertiary">
          {t(`meals.${mealType}`)}
        </Text>
        {/* An empty meal shows no total rather than "0 kcal", which would read as a logged
            value -- same rule as Today's MealCard. */}
        {isEmpty ? null : (
          <Text variant="caption" color="text.secondary" testID={`journal.mealTotal.${mealType}`}>
            {formatKcal(calories)}
          </Text>
        )}
      </HeaderRow>

      {isEmpty ? (
        <Text variant="caption" color="text.disabled" style={styles.empty}>
          {t('journal.meal.empty')}
        </Text>
      ) : (
        <ListCard>
          {entries.map((entry) => (
            <ListRow
              key={entry.id}
              label={entry.label}
              sublabel={`${entry.quantity} ${unitLabel(t, entry.unit)}`}
              value={formatKcal(entry.calories)}
              onPress={() => onEntryPress(entry)}
            />
          ))}
        </ListCard>
      )}

      <Button
        testID={`journal.mealSection.${mealType}.add`}
        label={t('journal.meal.add')}
        variant="ghost"
        size="md"
        onPress={onAddPress}
      />
    </Container>
  );
}

export default MealSection;
