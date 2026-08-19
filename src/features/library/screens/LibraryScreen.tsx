import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import { database } from '@/data/database';
import { foodRepository, recipeRepository } from '@/data/repositories';
import { getRecipesCalories } from '@/data/repositories/getRecipesCalories';
import type { Food, Recipe, RecipeIngredient, Result } from '@/domain/types';
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
import { formatInteger, unitLabel } from '@/utils/format';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * French kcal label for a food card (KCAL-158): "64 kcal pour 100 g" / "24 kcal pour 100 ml" /
 * "78 kcal par unité" -- never "78 kcal pour 1 unité": a `referenceUnit === 'unit'` food always
 * has `referenceQuantity = 1`, so the "pour N unité" phrasing would read oddly.
 */
function foodKcalLabel(t: TFunction, food: Food): string {
  const kcal = formatInteger(food.calories);
  if (food.referenceUnit === 'unit') {
    return t('library.food.kcalPerUnit', { kcal });
  }
  return t('library.food.kcalPerReference', {
    kcal,
    quantity: formatInteger(food.referenceQuantity),
    unit: unitLabel(t, food.referenceUnit),
  });
}

// Light debounce (KCAL-103): avoids re-running the observed WatermelonDB
// query on every keystroke while still feeling instant.
const SEARCH_DEBOUNCE_MS = 250;

type FilterKey = 'all' | 'favorites' | 'foods' | 'recipes';

const FILTERS: FilterKey[] = ['all', 'favorites', 'foods', 'recipes'];

const EMPTY_FOODS: Food[] = [];
const EMPTY_RECIPES: Recipe[] = [];
const EMPTY_USAGES: RecipeIngredient[] = [];

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
              {foodKcalLabel(t, food)}
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

type RecipeListItemProps = {
  recipe: Recipe;
  /** Per-portion kcal (KCAL-158), `undefined` while `getRecipesCalories` hasn't
   *  resolved yet -- never rendered as "0 kcal", which would be a false reading. */
  kcalPerPortion: number | undefined;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDeletePress: () => void;
};

/**
 * KCAL-142/144/162 — Card light item: tap navigates to the recipe detail, tap ★
 * toggles favorite inline, tap the trash icon opens the archive confirmation
 * (same nested-Pressable pattern as `FoodListItem` so the star/trash taps
 * never also trigger the outer card's onPress).
 */
function RecipeListItem({
  recipe,
  kcalPerPortion,
  onPress,
  onToggleFavorite,
  onDeletePress,
}: RecipeListItemProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      testID={`library.recipeCard.${recipe.id}`}
      onPress={onPress}
    >
      <Card tone="light">
        <FoodCardRow>
          <View style={{ flexShrink: 1, paddingRight: 12 }}>
            <Text variant="body" color="text.primary">
              {recipe.name}
            </Text>
            <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
              {kcalPerPortion === undefined
                ? t('library.recipe.servings', { count: recipe.servings })
                : t('library.recipe.kcalPerPortion', {
                    kcal: formatInteger(kcalPerPortion),
                    count: recipe.servings,
                  })}
            </Text>
          </View>

          <FoodCardActions>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                recipe.isFavorite
                  ? t('library.recipe.removeFavorite', { name: recipe.name })
                  : t('library.recipe.addFavorite', { name: recipe.name })
              }
              accessibilityState={{ selected: recipe.isFavorite }}
              hitSlop={10}
              testID={`library.recipeCard.${recipe.id}.favorite`}
              onPress={onToggleFavorite}
            >
              <Ionicons
                name={recipe.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={recipe.isFavorite ? theme.colors.azure[400] : theme.colors.text.disabled}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.recipe.deleteLabel', { name: recipe.name })}
              hitSlop={10}
              testID={`library.recipeCard.${recipe.id}.delete`}
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
  /** Set when the last `onConfirmDelete`/`onArchiveInstead` attempt returned a failed
   *  `Result` (KCAL-153): the sheet stays open and shows this instead of closing silently. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onArchiveInstead: () => void;
};

/**
 * KCAL-119/145/153 — not-in-use: "Supprimer / Annuler". In-use: "Archiver / Annuler"
 * only (RM15) -- "Supprimer quand même" was a silent no-op (`foodRepository.delete`
 * always rejects a food still referenced by a recipe) and has been removed entirely,
 * along with its `library.deleteDialog.confirm` testID in this branch.
 * `deletability` is computed from `checkFoodDeletable` against the real
 * `RecipeIngredient[]` usages fetched via `recipeRepository.findUsagesByFoodId`
 * (see the `foodUsages` effect below), so the "in use" branch is reachable
 * whenever the food is referenced by a recipe.
 */
function DeleteFoodSheet({
  food,
  deletability,
  errorMessage,
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
          {errorMessage ? (
            <Text
              variant="bodySm"
              color="text.accent"
              style={{ marginTop: 8 }}
              testID="library.deleteDialog.error"
            >
              {errorMessage}
            </Text>
          ) : null}

          <DialogActions>
            {isInUse ? (
              <Button
                label={t('library.deleteDialog.archive')}
                variant="primary"
                testID="library.deleteDialog.archive"
                onPress={onArchiveInstead}
              />
            ) : (
              <Button
                label={t('library.deleteDialog.confirm')}
                variant="primary"
                testID="library.deleteDialog.confirm"
                onPress={onConfirmDelete}
              />
            )}
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

type ArchiveRecipeSheetProps = {
  recipe: Recipe | null;
  /** Set when the last `onConfirmArchive` attempt returned a failed `Result` (mirrors
   *  `DeleteFoodSheet.errorMessage`, KCAL-153): the sheet stays open and shows this
   *  instead of closing silently. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirmArchive: () => void;
};

/**
 * KCAL-162 — "Archiver <name> ?" / explanation / Archiver (primary) · Annuler (ghost).
 * Mirrors the food deletion flow's error handling (KCAL-153): a failed `archive()`
 * Result keeps this sheet open with `errorMessage` shown, never closes silently.
 */
function ArchiveRecipeSheet({
  recipe,
  errorMessage,
  onCancel,
  onConfirmArchive,
}: ArchiveRecipeSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={recipe !== null} onClose={onCancel}>
      {recipe ? (
        <View testID="library.archiveRecipeDialog">
          <Text variant="h2">{t('library.archiveRecipeDialog.title', { name: recipe.name })}</Text>
          <Text variant="bodySm" color="text.secondary" style={{ marginTop: 8 }}>
            {t('library.archiveRecipeDialog.message')}
          </Text>
          {errorMessage ? (
            <Text
              variant="bodySm"
              color="text.accent"
              style={{ marginTop: 8 }}
              testID="library.archiveRecipeDialog.error"
            >
              {errorMessage}
            </Text>
          ) : null}

          <DialogActions>
            <Button
              label={t('library.archiveRecipeDialog.archive')}
              variant="primary"
              testID="library.archiveRecipeDialog.archive"
              onPress={onConfirmArchive}
            />
            <Button
              label={t('library.archiveRecipeDialog.cancel')}
              variant="ghost"
              testID="library.archiveRecipeDialog.cancel"
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
  // KCAL-153 — set when the last delete/archive attempt for `foodPendingDeletion`
  // returned a failed Result; the sheet stays open and shows it instead of closing
  // silently on an error.
  const [foodDeleteError, setFoodDeleteError] = useState<string | null>(null);
  // KCAL-162 — recipe archive dialog, mirroring the food deletion state above.
  const [recipePendingArchive, setRecipePendingArchive] = useState<Recipe | null>(null);
  const [recipeArchiveError, setRecipeArchiveError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // Stable Observable reference per query (KCAL-103): `foodRepository.search`
  // creates a new observed query each call, so this is memoized on the
  // debounced query alone to avoid resubscribing on unrelated re-renders.
  const searchObservable = useMemo(() => foodRepository.search(debouncedQuery), [debouncedQuery]);
  const foods = useObservable(searchObservable, EMPTY_FOODS);

  // KCAL-142 — same stable-Observable pattern as foods, sharing the single
  // search field (RecipeRepository.search is name-based, like foodRepository.search).
  const recipeSearchObservable = useMemo(
    () => recipeRepository.search(debouncedQuery),
    [debouncedQuery],
  );
  const recipes = useObservable(recipeSearchObservable, EMPTY_RECIPES);

  // KCAL-108: the true empty-library state only applies to a fresh library
  // (no search in progress), not to "no results for this search".
  const isLibraryEmpty = foods.length === 0 && recipes.length === 0 && debouncedQuery.trim() === '';

  // KCAL-104 — client-side filtering of the observed result (decided in
  // KCAL-101: no repository-level favorites param).
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

  // KCAL-143 — mirrors `filteredFoods`: the "Aliments" chip hides recipes,
  // the "Favoris" chip applies to recipes too.
  const filteredRecipes = useMemo(() => {
    switch (selectedFilter) {
      case 'favorites':
        return recipes.filter((recipe) => recipe.isFavorite);
      case 'foods':
        return [];
      case 'recipes':
      case 'all':
      default:
        return recipes;
    }
  }, [recipes, selectedFilter]);

  // KCAL-157 — the active quick filter drives whether a whole section exists in the
  // render tree, not just whether its content is empty: filtering to "Aliments" means
  // the Recettes section (and its "Aucun résultat") shouldn't be there at all.
  const showRecipesSection = selectedFilter !== 'foods';
  const showFoodsSection = selectedFilter !== 'recipes';

  // KCAL-157 — when every currently visible section is empty during an active search,
  // show one message mentioning the query instead of two stacked "Aucun résultat".
  // Gated on `isSearching` (rather than firing whenever a filter like ★ Favoris simply
  // has nothing to show without any search in progress) because the global message
  // names the search term -- there'd be nothing meaningful to name otherwise.
  const isSearching = debouncedQuery.trim() !== '';
  const showGlobalNoResults =
    isSearching &&
    (!showRecipesSection || filteredRecipes.length === 0) &&
    (!showFoodsSection || filteredFoods.length === 0);

  // KCAL-105/143 — HeroCard counts reflect the current (searched) result set, and are
  // deliberately NOT filtered by `selectedFilter` (KCAL-157): the hero always reflects
  // the real library content, independent of the active quick filter chip.
  const counts = useMemo(
    () => ({
      foods: foods.length,
      recipes: recipes.length,
      favorites: foods.filter((food) => food.isFavorite).length,
    }),
    [foods, recipes],
  );

  // KCAL-158 — per-portion kcal for the currently observed recipes, computed in 2
  // batched queries total via `getRecipesCalories` (not 2 per recipe -- see that
  // function's doc comment for why). Mirrors the `foodUsages` cancellation-flag
  // pattern below so a fast repeated search doesn't display stale calories from a
  // superseded request.
  const [recipeCalories, setRecipeCalories] = useState<Map<string, number>>(new Map());

  const refreshRecipeCalories = useCallback((recipeList: Recipe[]) => {
    let cancelled = false;
    getRecipesCalories(database, recipeList).then((calories) => {
      if (!cancelled) setRecipeCalories(calories);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refreshRecipeCalories(recipes), [recipes, refreshRecipeCalories]);

  // KCAL-158 — `recipeRepository.search()`'s observable only watches the `recipes`
  // table, not joined foods, so editing a food's calories doesn't re-trigger the
  // effect above and the recipe cards would show stale kcal. Recomputing on focus
  // covers the real navigation path (edit a food, come back to the library) without
  // opening a joint observable just for this display.
  useFocusEffect(
    useCallback(() => refreshRecipeCalories(recipes), [recipes, refreshRecipeCalories]),
  );

  // KCAL-145 — `findUsagesByFoodId` is async, so the deletability check can no
  // longer be a pure useMemo: fetch usages when the pending-deletion food
  // changes, then derive `deletability` from that state. `cancelled` guards
  // against setting state from a stale request if the food changes (or the
  // sheet is dismissed) before the query resolves.
  const [foodUsages, setFoodUsages] = useState<RecipeIngredient[]>(EMPTY_USAGES);

  useEffect(() => {
    // No reset-to-empty branch needed: `deletability` below already returns
    // `null` whenever `foodPendingDeletion` is null, regardless of stale
    // `foodUsages` from a previous dialog — avoids a synchronous setState
    // in the effect body for the "no pending deletion" case.
    if (!foodPendingDeletion) return;

    let cancelled = false;
    recipeRepository.findUsagesByFoodId(foodPendingDeletion.id).then((usages) => {
      if (!cancelled) setFoodUsages(usages);
    });

    return () => {
      cancelled = true;
    };
  }, [foodPendingDeletion]);

  const deletability = useMemo<Deletability>(
    () => (foodPendingDeletion ? checkFoodDeletable(foodPendingDeletion.id, foodUsages) : null),
    [foodPendingDeletion, foodUsages],
  );

  function handleCreatePress() {
    navigation.navigate('FoodForm');
  }

  function handleCreateRecipePress() {
    navigation.navigate('RecipeForm');
  }

  function handleRecipePress(recipeId: string) {
    navigation.navigate('RecipeDetail', { recipeId });
  }

  async function handleToggleRecipeFavorite(recipe: Recipe) {
    await recipeRepository.update(recipe.id, { isFavorite: !recipe.isFavorite });
  }

  function handleFoodPress(foodId: string) {
    navigation.navigate('FoodForm', { foodId });
  }

  async function handleToggleFavorite(food: Food) {
    await foodRepository.update(food.id, { isFavorite: !food.isFavorite });
  }

  function handleDeletePress(food: Food) {
    setFoodDeleteError(null);
    setFoodPendingDeletion(food);
  }

  function handleCancelDelete() {
    setFoodPendingDeletion(null);
    setFoodDeleteError(null);
  }

  // KCAL-153 — the root cause of the "Supprimer quand même" no-op was this handler
  // discarding the `Result`: a failed delete/archive must keep the sheet open with an
  // error, never close silently as if it had succeeded.
  async function handleConfirmDelete() {
    if (!foodPendingDeletion) return;
    const result = await foodRepository.delete(foodPendingDeletion.id);
    if (!result.ok) {
      setFoodDeleteError(t('library.deleteDialog.deleteError'));
      return;
    }
    setFoodDeleteError(null);
    setFoodPendingDeletion(null);
  }

  async function handleArchiveInstead() {
    if (!foodPendingDeletion) return;
    const result = await foodRepository.archive(foodPendingDeletion.id);
    if (!result.ok) {
      setFoodDeleteError(t('library.deleteDialog.archiveError'));
      return;
    }
    setFoodDeleteError(null);
    setFoodPendingDeletion(null);
  }

  function handleArchiveRecipePress(recipe: Recipe) {
    setRecipeArchiveError(null);
    setRecipePendingArchive(recipe);
  }

  function handleCancelArchiveRecipe() {
    setRecipePendingArchive(null);
    setRecipeArchiveError(null);
  }

  // KCAL-162 — same "never close silently on failure" requirement as KCAL-153 above.
  async function handleConfirmArchiveRecipe() {
    if (!recipePendingArchive) return;
    const result = await recipeRepository.archive(recipePendingArchive.id);
    if (!result.ok) {
      setRecipeArchiveError(t('library.archiveRecipeDialog.archiveError'));
      return;
    }
    setRecipeArchiveError(null);
    setRecipePendingArchive(null);
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
            onClear={() => setSearchQuery('')}
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

          {showGlobalNoResults ? (
            <Text variant="bodySm" color="text.tertiary" testID="library.list.noResultsGlobal">
              {t('library.list.noResultsForQuery', { query: debouncedQuery })}
            </Text>
          ) : (
            <>
              {/* KCAL-157 — the whole section (not just its content) is gated on
                  `showRecipesSection`: filtering to "Aliments" must remove this
                  section, including its "+" create button, from the render tree
                  entirely rather than merely hiding its list. */}
              {showRecipesSection ? (
                <SectionBlock testID="library.section.recipes">
                  <HeaderRow>
                    <Text variant="overline" color="text.tertiary">
                      {t('library.sections.recipes')}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('library.addRecipeButtonLabel')}
                      hitSlop={8}
                      testID="library.addRecipeButton"
                      onPress={handleCreateRecipePress}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.ink[800],
                      }}
                    >
                      <Ionicons name="add" size={14} color="#FFFFFF" />
                    </Pressable>
                  </HeaderRow>
                  {filteredRecipes.length === 0 ? (
                    <Text variant="bodySm" color="text.tertiary">
                      {t('library.list.noResults')}
                    </Text>
                  ) : (
                    filteredRecipes.map((recipe) => (
                      <RecipeListItem
                        key={recipe.id}
                        recipe={recipe}
                        kcalPerPortion={recipeCalories.get(recipe.id)}
                        onPress={() => handleRecipePress(recipe.id)}
                        onToggleFavorite={() => handleToggleRecipeFavorite(recipe)}
                        onDeletePress={() => handleArchiveRecipePress(recipe)}
                      />
                    ))
                  )}
                </SectionBlock>
              ) : null}

              {showFoodsSection ? (
                <SectionBlock testID="library.section.foods">
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
                        onDeletePress={() => handleDeletePress(food)}
                      />
                    ))
                  )}
                </SectionBlock>
              ) : null}
            </>
          )}
        </Content>
      </ScrollView>

      <DeleteFoodSheet
        food={foodPendingDeletion}
        deletability={deletability}
        errorMessage={foodDeleteError}
        onCancel={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        onArchiveInstead={handleArchiveInstead}
      />

      <ArchiveRecipeSheet
        recipe={recipePendingArchive}
        errorMessage={recipeArchiveError}
        onCancel={handleCancelArchiveRecipe}
        onConfirmArchive={handleConfirmArchiveRecipe}
      />
    </Safe>
  );
}

export default LibraryScreen;
