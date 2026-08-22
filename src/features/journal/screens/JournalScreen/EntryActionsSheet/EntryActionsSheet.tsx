import { useTranslation } from 'react-i18next';

import { MEAL_TYPES, type DiaryEntry, type MealType } from '@/domain/types';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import Text from '@/ui/Text';
import { formatKcal } from '@/utils/format';

import { Container, styles } from './EntryActionsSheet.styles';

export type EntryActionsSheetProps = {
  /** `null` closes the sheet. */
  entry: DiaryEntry | null;
  /** Set when the last action returned a failed `Result`: the sheet stays open and shows it. */
  errorMessage: string | null;
  /**
   * `'actions'` shows the three actions, `'meal'` the meal picker (KCAL-193), `'confirmDelete'`
   * the deletion confirmation (KCAL-194).
   */
  step: 'actions' | 'meal' | 'confirmDelete';
  onClose: () => void;
  onEditQuantity: () => void;
  onChangeMeal: () => void;
  onSelectMeal: (mealType: MealType) => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
};

/**
 * The three F14 actions on a journal entry, on the DeleteFoodSheet pattern (KCAL-191).
 *
 * Deliberate departure from the handoff: screens.md 2b says "tap = suppression directe", but
 * F14 requires three actions and the mockup offers no other entry point for the first two.
 * To be reported back into screens.md at sprint close, same handling as KCAL-156/159/161 in
 * Sprint 2.
 *
 * A failed action keeps the sheet open with `errorMessage` set rather than closing silently --
 * the KCAL-153 lesson, where a delete failed quietly and looked like it had worked.
 */
export function EntryActionsSheet({
  entry,
  errorMessage,
  step,
  onClose,
  onEditQuantity,
  onChangeMeal,
  onSelectMeal,
  onDelete,
  onConfirmDelete,
}: EntryActionsSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={entry !== null} onClose={onClose}>
      {entry ? (
        <Container testID="journal.entryActions">
          <Text variant="h2">{entry.label}</Text>
          <Text variant="caption" color="text.tertiary" style={styles.subtitle}>
            {formatKcal(entry.calories)}
          </Text>

          {errorMessage ? (
            <Text
              variant="bodySm"
              color="text.accent"
              style={styles.error}
              testID="journal.entryActions.error"
            >
              {errorMessage}
            </Text>
          ) : null}

          {step === 'confirmDelete' ? (
            // Deleting a diary entry is irreversible and unlike RM15 has nothing to check
            // against, so the confirmation is the only guard -- hence a separate step rather
            // than a delete that fires on first tap.
            <>
              <Text variant="bodySm" color="text.secondary" style={styles.subtitle}>
                {t('journal.entryActions.deleteConfirmMessage')}
              </Text>
              <Button
                testID="journal.entryActions.confirmDelete"
                label={t('journal.entryActions.delete')}
                variant="primary"
                onPress={onConfirmDelete}
              />
            </>
          ) : step === 'meal' ? (
            // Iterates MEAL_TYPES so the choice list keeps F10's order (KCAL-170). The entry's
            // current meal is marked but still tappable -- picking it is a no-op, not an error.
            MEAL_TYPES.map((mealType) => (
              <Button
                key={mealType}
                testID={`journal.entryActions.meal.${mealType}`}
                label={t(`meals.${mealType}`)}
                variant={mealType === entry.mealType ? 'primary' : 'secondary'}
                onPress={() => onSelectMeal(mealType)}
              />
            ))
          ) : (
            <>
              <Button
                testID="journal.entryActions.editQuantity"
                label={t('journal.entryActions.editQuantity')}
                variant="secondary"
                onPress={onEditQuantity}
              />
              <Button
                testID="journal.entryActions.changeMeal"
                label={t('journal.entryActions.changeMeal')}
                variant="secondary"
                onPress={onChangeMeal}
              />
              <Button
                testID="journal.entryActions.delete"
                label={t('journal.entryActions.delete')}
                variant="secondary"
                onPress={onDelete}
              />
            </>
          )}
          <Button
            testID="journal.entryActions.cancel"
            label={t('journal.entryActions.cancel')}
            variant="ghost"
            onPress={onClose}
          />
        </Container>
      ) : null}
    </BottomSheet>
  );
}

export default EntryActionsSheet;
