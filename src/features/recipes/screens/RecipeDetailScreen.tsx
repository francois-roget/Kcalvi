import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

import { database } from '@/data/database';
import { recipeRepository } from '@/data/repositories';
import { getRecipeWithIngredients } from '@/data/repositories/getRecipeWithIngredients';
import type { CreateRecipeInput } from '@/data/repositories/RecipeRepository';
import {
  calculatePortionNutrition,
  calculateProportionalNutrition,
  calculateRecipeTotals,
} from '@/domain/calculations';
import type { Food, Recipe, RecipeIngredient } from '@/domain/types';
import type { RecipeDetailScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import HeroCard from '@/ui/HeroCard';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatDecimal, formatInteger } from '@/utils/format';

type RecipeWithIngredients = {
  recipe: Recipe;
  items: { ingredient: RecipeIngredient; food: Food }[];
};

const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: ${({ theme }) => theme.spacing[3]}px;
`;

const Content = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[8]}px;
  gap: ${({ theme }) => theme.spacing[6]}px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
`;

const SectionBlock = styled.View`
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

const HeroPortionRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[3]}px;
`;

const MacrosColumn = styled.View`
  align-items: flex-end;
  gap: 3px;
`;

const ButtonsRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export function RecipeDetailScreen({ route, navigation }: RecipeDetailScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const { recipeId } = route.params;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [data, setData] = useState<RecipeWithIngredients | null>(null);

  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getRecipeWithIngredients(database, recipeId);
      if (cancelled) return;
      setLoading(false);

      if (!result.ok) {
        setLoadError(true);
        return;
      }

      setData(result.value);
    })();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  // KCAL-139 (RM03 then F09): recipe totals then per-portion split. Recomputed whenever
  // the loaded recipe/ingredients change -- there is no local edit state on this
  // read-only screen, so this never needs to react to anything else.
  const recipeTotals = useMemo(() => {
    if (!data) return null;
    return calculateRecipeTotals(data.recipe, data.items);
  }, [data]);

  const portionNutrition = useMemo(() => {
    if (!data || !recipeTotals) return null;
    return calculatePortionNutrition(recipeTotals, data.recipe.servings);
  }, [data, recipeTotals]);

  function handleEditPress() {
    navigation.navigate('RecipeForm', { recipeId });
  }

  // KCAL-141: clones the recipe (same servings/notes/favorite) and every ingredient row
  // via `recipeRepository.create`, then lands the user directly in edit mode on the new
  // copy so they can tweak it right away instead of going back through the detail view.
  async function handleDuplicate() {
    if (!data || duplicating) return;
    setDuplicating(true);
    setDuplicateError(false);

    const input: CreateRecipeInput = {
      name: t('recipeDetail.duplicate.copyName', { name: data.recipe.name }),
      servings: data.recipe.servings,
      notes: data.recipe.notes,
      isFavorite: data.recipe.isFavorite,
      ingredients: data.items.map(({ ingredient }) => ({
        foodId: ingredient.foodId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
    };

    const result = await recipeRepository.create(input);
    setDuplicating(false);

    if (!result.ok) {
      setDuplicateError(true);
      return;
    }

    navigation.navigate('RecipeForm', { recipeId: result.value.id });
  }

  if (loading) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="body" color="text.secondary">
            {t('recipeDetail.loading')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  if (loadError || !data || !recipeTotals || !portionNutrition) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="bodySm" color="text.accent" testID="recipeDetail.notFoundError">
            {t('recipeDetail.notFoundError')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  const { recipe, items } = data;

  return (
    <Safe edges={['top', 'bottom']}>
      <HeaderRow>
        <Pressable
          testID="recipeDetail.header.back"
          accessibilityRole="button"
          accessibilityLabel={t('recipeDetail.header.backLabel')}
          hitSlop={12}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Button
          testID="recipeDetail.header.edit"
          label={t('recipeDetail.header.edit')}
          variant="ghost"
          size="md"
          onPress={handleEditPress}
        />
      </HeaderRow>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Content>
          <View>
            <Text variant="h1">{recipe.name}</Text>
            {/* KCAL-138: favorite is shown read-only here -- the only toggle control lives
                on the Library list, not on this screen. */}
            <Text variant="bodySm" color="text.tertiary" style={{ marginTop: 4 }}>
              {t('recipeDetail.subtitle.portions', { count: recipe.servings })}
              {recipe.isFavorite ? ` · ${t('recipeDetail.subtitle.favorite')}` : ''}
            </Text>
          </View>

          <HeroCard>
            <Text variant="overline" color="onDark.subtle">
              {t('recipeDetail.perPortion.title')}
            </Text>
            <HeroPortionRow>
              <View>
                <Text variant="stat" color="onDark.primary">
                  {formatInteger(portionNutrition.calories)}
                </Text>
                <Text variant="micro" color="onDark.subtle">
                  {t('recipeDetail.perPortion.kcalLabel')}
                </Text>
              </View>

              <MacrosColumn>
                <Text variant="micro" color="onDark.muted">
                  {t('recipeDetail.perPortion.macroProtein', {
                    value: formatDecimal(portionNutrition.protein),
                  })}
                </Text>
                <Text variant="micro" color="onDark.muted">
                  {t('recipeDetail.perPortion.macroCarbs', {
                    value: formatDecimal(portionNutrition.carbs),
                  })}
                </Text>
                <Text variant="micro" color="onDark.muted">
                  {t('recipeDetail.perPortion.macroFat', {
                    value: formatDecimal(portionNutrition.fat),
                  })}
                </Text>
              </MacrosColumn>
            </HeroPortionRow>
          </HeroCard>

          <SectionBlock>
            <Text variant="overline" color="text.tertiary">
              {t('recipeDetail.ingredients.sectionTitle')}
            </Text>
            <ListCard>
              {items.map(({ ingredient, food }) => (
                <ListRow
                  key={ingredient.id}
                  label={food.name}
                  sublabel={`${formatDecimal(ingredient.quantity)} ${ingredient.unit}`}
                  value={t('recipeDetail.ingredients.kcalValue', {
                    value: formatInteger(
                      calculateProportionalNutrition(food, ingredient.quantity).calories,
                    ),
                  })}
                />
              ))}
              <ListRow
                label={t('recipeDetail.ingredients.totalLabel')}
                value={t('recipeDetail.ingredients.kcalValue', {
                  value: formatInteger(recipeTotals.calories),
                })}
              />
            </ListCard>
          </SectionBlock>

          {duplicateError ? (
            <Text variant="bodySm" color="text.accent" testID="recipeDetail.duplicateError">
              {t('recipeDetail.duplicate.error')}
            </Text>
          ) : null}

          <ButtonsRow>
            <View style={{ flex: 1 }}>
              <Button
                testID="recipeDetail.actions.duplicate"
                label={t('recipeDetail.actions.duplicate')}
                variant="secondary"
                disabled={duplicating}
                onPress={handleDuplicate}
              />
            </View>
            <View style={{ flex: 2 }}>
              {/* KCAL-141: DiaryEntryRepository/AddEntryScreen don't exist until Sprint 3
                  (SPRINT2-DETAILS.MD), so this CTA is rendered visibly disabled with no
                  onPress action -- same pattern as LibraryScreen's disabled empty-state
                  secondary CTA (KCAL-108). */}
              <Button
                testID="recipeDetail.actions.addToMeal"
                label={t('recipeDetail.actions.addToMeal')}
                variant="primary"
                disabled
                accessibilityHint={t('recipeDetail.actions.addToMealHint')}
              />
            </View>
          </ButtonsRow>
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default RecipeDetailScreen;
