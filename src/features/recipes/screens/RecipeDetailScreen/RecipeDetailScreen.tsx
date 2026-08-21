import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { RecipeDetailScreenProps } from '@/navigation/types';
import Text from '@/ui/Text';

import { IngredientList } from './IngredientList';
import { PortionSummaryCard } from './PortionSummaryCard';
import { RecipeActionsFooter } from './RecipeActionsFooter';
import { RecipeDetailHeader } from './RecipeDetailHeader';
import { useDuplicateRecipe, useRecipeDetailData } from './RecipeDetailScreen.helpers';
import { Content, LoadingContainer, Safe, styles } from './RecipeDetailScreen.styles';

export function RecipeDetailScreen({ route, navigation }: RecipeDetailScreenProps) {
  const { t } = useTranslation();
  const { recipeId } = route.params;

  const { loading, loadError, data, recipeTotals, portionNutrition } =
    useRecipeDetailData(recipeId);
  const { duplicating, duplicateError, handleDuplicate } = useDuplicateRecipe(data, navigation);

  function handleEditPress() {
    navigation.navigate('RecipeForm', { recipeId });
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
      <RecipeDetailHeader onBackPress={() => navigation.goBack()} onEditPress={handleEditPress} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Content>
          <View>
            <Text variant="h1">{recipe.name}</Text>
            {/* KCAL-138: favorite is shown read-only here -- the only toggle control lives
                on the Library list, not on this screen. */}
            <Text variant="bodySm" color="text.tertiary" style={styles.subtitle}>
              {t('recipeDetail.subtitle.portions', { count: recipe.servings })}
              {recipe.isFavorite ? ` · ${t('recipeDetail.subtitle.favorite')}` : ''}
            </Text>
          </View>

          <PortionSummaryCard portionNutrition={portionNutrition} />

          <IngredientList items={items} totalCalories={recipeTotals.calories} />

          <RecipeActionsFooter
            duplicating={duplicating}
            duplicateError={duplicateError}
            onDuplicate={handleDuplicate}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default RecipeDetailScreen;
