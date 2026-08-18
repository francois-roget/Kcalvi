import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import { foodRepository } from '@/data/repositories';
import type { Food, Result } from '@/domain/types';
import { checkFoodDeletable } from '@/domain/validation';
import { useObservable } from '@/hooks/useObservable';
import type { LibraryScreenProps } from '@/navigation/types';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import Card from '@/ui/Card';
import Chip from '@/ui/Chip';
import HeroCard from '@/ui/HeroCard';
import SearchField from '@/ui/SearchField';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatInteger } from '@/utils/format';

// Light debounce (KCAL-103): avoids re-running the observed WatermelonDB
// query on every keystroke while still feeling instant.
const SEARCH_DEBOUNCE_MS = 250;

type FilterKey = 'all' | 'favorites' | 'foods' | 'recipes';

const FILTERS: FilterKey[] = ['all', 'favorites', 'foods', 'recipes'];

const EMPTY_FOODS: Food[] = [];

type FoodInUseError = { code: 'FOOD_IN_USE'; message: string; recipeIds: string[] };
type Deletability = Result<void, FoodInUseError> | null;

const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

const Content = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[8]}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

const CenteredContent = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 7px;
`;

const HeroRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const HeroColumn = styled.View`
  flex: 1;
  align-items: center;
  gap: 4px;
`;

const HeroDivider = styled.View`
  width: 1px;
  align-self: stretch;
  background-color: ${({ theme }) => theme.colors.ink[700]};
`;

const SectionBlock = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const FoodCardRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const FoodCardActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const EmptyIconSquare = styled.View`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.xl}px;
  background-color: ${({ theme }) => theme.colors.azure[100]};
  align-items: center;
  justify-content: center;
`;

const EmptyActions = styled.View`
  width: 100%;
  gap: 9px;
  margin-top: ${({ theme }) => theme.spacing[3]}px;
`;

const DialogActions = styled.View`
  gap: 9px;
  margin-top: ${({ theme }) => theme.spacing[5]}px;
`;

/** Debounces a fast-changing value (e.g. search input) by `delayMs`. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

type FoodListItemProps = {
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
function FoodListItem({ food, onPress, onToggleFavorite, onDeletePress }: FoodListItemProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <Pressable accessibilityRole="button" testID={`library.foodCard.${food.id}`} onPress={onPress}>
      <Card tone="light">
        <FoodCardRow>
          <View style={{ flexShrink: 1, paddingRight: 12 }}>
            <Text variant="body" color="text.primary">
              {food.name}
            </Text>
            <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
              {formatInteger(food.referenceQuantity)} {food.referenceUnit}
            </Text>
          </View>

          <FoodCardActions>
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
          </FoodCardActions>
        </FoodCardRow>
      </Card>
    </Pressable>
  );
}

type DeleteFoodSheetProps = {
  food: Food | null;
  deletability: Deletability;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onArchiveInstead: () => void;
};

/**
 * KCAL-119 — "Annuler / Archiver / Supprimer quand même" (RM15).
 * `deletability` is computed from `checkFoodDeletable`; since `RecipeRepository`
 * doesn't exist yet this sprint the caller always passes an empty usages array,
 * so the "in use" branch below is implemented but not reachable in practice
 * this sprint (see SPRINT1-DETAILS.MD section D).
 */
function DeleteFoodSheet({
  food,
  deletability,
  onCancel,
  onConfirmDelete,
  onArchiveInstead,
}: DeleteFoodSheetProps) {
  const { t } = useTranslation();
  const isInUse = deletability !== null && !deletability.ok;
  const recipeCount =
    deletability !== null && !deletability.ok ? deletability.error.recipeIds.length : 0;

  return (
    <BottomSheet visible={food !== null} onClose={onCancel}>
      {food ? (
        <View testID="library.deleteDialog">
          <Text variant="h2">
            {isInUse
              ? t('library.deleteDialog.inUseTitle', { count: recipeCount })
              : t('library.deleteDialog.title', { name: food.name })}
          </Text>
          <Text variant="bodySm" color="text.secondary" style={{ marginTop: 8 }}>
            {isInUse ? t('library.deleteDialog.inUseMessage') : t('library.deleteDialog.message')}
          </Text>

          <DialogActions>
            {isInUse ? (
              <Button
                label={t('library.deleteDialog.archive')}
                variant="secondary"
                testID="library.deleteDialog.archive"
                onPress={onArchiveInstead}
              />
            ) : null}
            <Button
              label={
                isInUse
                  ? t('library.deleteDialog.confirmAnyway')
                  : t('library.deleteDialog.confirm')
              }
              variant="primary"
              testID="library.deleteDialog.confirm"
              onPress={onConfirmDelete}
            />
            <Button
              label={t('library.deleteDialog.cancel')}
              variant="ghost"
              testID="library.deleteDialog.cancel"
              onPress={onCancel}
            />
          </DialogActions>
        </View>
      ) : null}
    </BottomSheet>
  );
}

type LibraryEmptyStateProps = { onCreatePress: () => void };

/** KCAL-108 — empty-library state (screen 2s). */
function LibraryEmptyState({ onCreatePress }: LibraryEmptyStateProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <CenteredContent>
      <EmptyIconSquare>
        <Ionicons name="nutrition-outline" size={28} color={theme.colors.azure[600]} />
      </EmptyIconSquare>

      <Text
        color="text.primary"
        style={{ fontFamily: 'Manrope_800ExtraBold', fontSize: 19, textAlign: 'center' }}
      >
        {t('library.empty.title')}
      </Text>
      <Text variant="bodySm" color="text.tertiary" style={{ textAlign: 'center', lineHeight: 20 }}>
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

export function LibraryScreen({ navigation }: LibraryScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [foodPendingDeletion, setFoodPendingDeletion] = useState<Food | null>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // Stable Observable reference per query (KCAL-103): `foodRepository.search`
  // creates a new observed query each call, so this is memoized on the
  // debounced query alone to avoid resubscribing on unrelated re-renders.
  const searchObservable = useMemo(() => foodRepository.search(debouncedQuery), [debouncedQuery]);
  const foods = useObservable(searchObservable, EMPTY_FOODS);

  // KCAL-108: the true empty-library state only applies to a fresh library
  // (no search in progress), not to "no results for this search".
  const isLibraryEmpty = foods.length === 0 && debouncedQuery.trim() === '';

  // KCAL-104 — client-side filtering of the observed result (decided in
  // KCAL-101: no repository-level favorites param). "Recettes" has no data
  // source yet (Sprint 2), so that chip's results are always empty this
  // sprint — expected, not a bug.
  const filteredFoods = useMemo(() => {
    switch (selectedFilter) {
      case 'favorites':
        return foods.filter((food) => food.isFavorite);
      case 'recipes':
        return [];
      case 'foods':
      case 'all':
      default:
        return foods;
    }
  }, [foods, selectedFilter]);

  // KCAL-105 — HeroCard counts reflect the current (searched) result set.
  const counts = useMemo(
    () => ({
      foods: foods.length,
      recipes: 0, // No RecipeRepository yet this sprint.
      favorites: foods.filter((food) => food.isFavorite).length,
    }),
    [foods],
  );

  const deletability = useMemo<Deletability>(
    () => (foodPendingDeletion ? checkFoodDeletable(foodPendingDeletion.id, []) : null),
    [foodPendingDeletion],
  );

  function handleCreatePress() {
    navigation.navigate('FoodForm');
  }

  function handleFoodPress(foodId: string) {
    navigation.navigate('FoodForm', { foodId });
  }

  async function handleToggleFavorite(food: Food) {
    await foodRepository.update(food.id, { isFavorite: !food.isFavorite });
  }

  async function handleConfirmDelete() {
    if (!foodPendingDeletion) return;
    await foodRepository.delete(foodPendingDeletion.id);
    setFoodPendingDeletion(null);
  }

  async function handleArchiveInstead() {
    if (!foodPendingDeletion) return;
    await foodRepository.archive(foodPendingDeletion.id);
    setFoodPendingDeletion(null);
  }

  if (isLibraryEmpty) {
    return (
      <Safe edges={['top', 'bottom']}>
        <Content style={{ flex: 1 }}>
          <HeaderRow>
            <Text variant="h1">{t('tabs.library')}</Text>
          </HeaderRow>
          <LibraryEmptyState onCreatePress={handleCreatePress} />
        </Content>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Content>
          <HeaderRow>
            <Text variant="h1">{t('tabs.library')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.addButtonLabel')}
              hitSlop={8}
              testID="library.addButton"
              onPress={handleCreatePress}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.ink[800],
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </Pressable>
          </HeaderRow>

          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('library.searchPlaceholder')}
            accessibilityLabel={t('library.searchPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            testID="library.searchField"
          />

          <ChipRow>
            {FILTERS.map((filter) => (
              <Chip
                key={filter}
                label={t(`library.filters.${filter}`)}
                selected={selectedFilter === filter}
                testID={`library.filter.${filter}`}
                onPress={() => setSelectedFilter(filter)}
              />
            ))}
          </ChipRow>

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
                <Text variant="stat" style={{ color: theme.colors.terracotta[300] }}>
                  {formatInteger(counts.recipes)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('library.hero.recipes')}
                </Text>
              </HeroColumn>

              <HeroDivider />

              <HeroColumn>
                <Text variant="stat" style={{ color: theme.colors.azure[400] }}>
                  {formatInteger(counts.favorites)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('library.hero.favorites')}
                </Text>
              </HeroColumn>
            </HeroRow>
          </HeroCard>

          <SectionBlock>
            <Text variant="overline" color="text.tertiary">
              {t('library.sections.recipes')}
            </Text>
            {/* KCAL-107: no recipe data source yet (Sprint 2) — section stays
                empty this sprint, layout is not blocked on it. */}
            <Text variant="bodySm" color="text.tertiary">
              {t('library.sections.recipesComingSoon')}
            </Text>
          </SectionBlock>

          <SectionBlock>
            <Text variant="overline" color="text.tertiary">
              {t('library.sections.foods')}
            </Text>
            {filteredFoods.length === 0 ? (
              <Text variant="bodySm" color="text.tertiary">
                {t('library.list.noResults')}
              </Text>
            ) : (
              filteredFoods.map((food) => (
                <FoodListItem
                  key={food.id}
                  food={food}
                  onPress={() => handleFoodPress(food.id)}
                  onToggleFavorite={() => handleToggleFavorite(food)}
                  onDeletePress={() => setFoodPendingDeletion(food)}
                />
              ))
            )}
          </SectionBlock>
        </Content>
      </ScrollView>

      <DeleteFoodSheet
        food={foodPendingDeletion}
        deletability={deletability}
        onCancel={() => setFoodPendingDeletion(null)}
        onConfirmDelete={handleConfirmDelete}
        onArchiveInstead={handleArchiveInstead}
      />
    </Safe>
  );
}

export default LibraryScreen;
