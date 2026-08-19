import { fireEvent, render, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import type { Food, Recipe, RecipeIngredient } from '@/domain/types';
import type { RecipeDetailScreenProps } from '@/navigation/types';
import { ThemeProvider } from '@/bootstrap/providers/ThemeProvider';
import { formatInteger } from '@/utils/format';

import { RecipeDetailScreen } from './RecipeDetailScreen';

// Same rationale as RecipeFormScreen.test.tsx: @expo/vector-icons pulls in expo-font ->
// expo-asset, which isn't hoisted to the root node_modules in this environment. This
// screen renders an Ionicons chevron-back glyph in its header.
jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <RNText>{name}</RNText>,
  };
});

// ListRow (used for the ingredient list) imports Toggle, which imports react-native-reanimated
// -- same issue as RecipeFormScreen.test.tsx: the package's own jest mock still boots the
// real worklets runtime, which isn't set up under this project's Jest config.
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    withTiming: (toValue: unknown) => toValue,
  };
});

// RecipeDetailScreen imports the real WatermelonDB `database` singleton at module scope
// (to pass to `getRecipeWithIngredients`). Constructing the real SQLiteAdapter has
// native/JSI side effects that don't work under Jest, so it's swapped for an inert stub --
// the mocked `getRecipeWithIngredients` below never actually reads it.
jest.mock('@/data/database', () => ({ database: {} }));

jest.mock('@/data/repositories/getRecipeWithIngredients', () => ({
  getRecipeWithIngredients: (...args: unknown[]) => mockGetRecipeWithIngredients(...args),
}));

jest.mock('@/data/repositories', () => ({
  recipeRepository: {
    search: jest.fn(),
    findById: jest.fn(),
    create: (input: unknown) => mockRecipeCreate(input),
    update: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
    findUsagesByFoodId: jest.fn(),
  },
}));

const mockGetRecipeWithIngredients = jest.fn();
const mockRecipeCreate = jest.fn();

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Poulet',
    calories: 200,
    protein: 30,
    carbs: 0,
    fat: 8,
    referenceQuantity: 100,
    referenceUnit: 'g',
    isFavorite: false,
    isArchived: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    name: 'Salade de poulet',
    servings: 2,
    isFavorite: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeIngredient(overrides: Partial<RecipeIngredient> = {}): RecipeIngredient {
  return {
    id: 'ri-1',
    recipeId: 'recipe-1',
    foodId: 'food-1',
    quantity: 150,
    unit: 'g',
    ...overrides,
  };
}

// Two ingredients with deliberately distinct kcal values (300 and 100) so the per-row
// kcal, the "Total recette" row (400) and the per-portion HeroCard value (200, servings=2)
// are all textually distinct -- avoids ambiguous findByText matches.
const CHICKEN = makeFood({ id: 'food-1', name: 'Poulet', calories: 200, referenceQuantity: 100 });
const TOMATO = makeFood({ id: 'food-2', name: 'Tomate', calories: 100, referenceQuantity: 100 });
const DEFAULT_ITEMS = [
  { ingredient: makeIngredient({ id: 'ri-1', foodId: 'food-1', quantity: 150 }), food: CHICKEN },
  {
    ingredient: makeIngredient({ id: 'ri-2', foodId: 'food-2', quantity: 100 }),
    food: TOMATO,
  },
];

async function renderScreen(recipeId = 'recipe-1') {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  } as unknown as RecipeDetailScreenProps['navigation'];
  const route = {
    key: 'RecipeDetail-test',
    name: 'RecipeDetail',
    params: { recipeId },
  } as unknown as RecipeDetailScreenProps['route'];

  const utils = await render(
    <ThemeProvider>
      <RecipeDetailScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );

  return { ...utils, navigation };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetRecipeWithIngredients.mockResolvedValue({
    ok: true,
    value: { recipe: makeRecipe(), items: DEFAULT_ITEMS },
  });
  mockRecipeCreate.mockResolvedValue({ ok: true, value: makeRecipe({ id: 'recipe-2' }) });
});

describe('RecipeDetailScreen — rendering (KCAL-138/139/140)', () => {
  it('renders the recipe name, portions/favorite subtitle, per-portion total and ingredient rows', async () => {
    const { findByText, getByText } = await renderScreen();

    await findByText('Salade de poulet');
    getByText(i18n.t('recipeDetail.subtitle.portions', { count: 2 }), { exact: false });
    getByText(i18n.t('recipeDetail.subtitle.favorite'), { exact: false });

    // Per-portion: (300 + 100) kcal total / 2 servings = 200 kcal/portion.
    await findByText(formatInteger(200));

    // Ingredient rows use `calculateProportionalNutrition` per food, not the total.
    await findByText(i18n.t('recipeDetail.ingredients.kcalValue', { value: formatInteger(300) }));
    await findByText(i18n.t('recipeDetail.ingredients.kcalValue', { value: formatInteger(100) }));
    // "Total recette" row sums both ingredients.
    await findByText(i18n.t('recipeDetail.ingredients.kcalValue', { value: formatInteger(400) }));
  });

  it('renders the not-found error state when the recipe fails to load', async () => {
    mockGetRecipeWithIngredients.mockResolvedValue({
      ok: false,
      error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe recipe-1 not found' },
    });

    const { findByTestId } = await renderScreen();

    await findByTestId('recipeDetail.notFoundError');
  });
});

describe('RecipeDetailScreen — navigation (KCAL-138)', () => {
  it('navigates back when the header back button is pressed', async () => {
    const { findByTestId, navigation } = await renderScreen();

    await fireEvent.press(await findByTestId('recipeDetail.header.back'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to RecipeForm in edit mode when "Modifier" is pressed', async () => {
    const { findByTestId, navigation } = await renderScreen();

    await fireEvent.press(await findByTestId('recipeDetail.header.edit'));

    expect(navigation.navigate).toHaveBeenCalledWith('RecipeForm', { recipeId: 'recipe-1' });
  });
});

describe('RecipeDetailScreen — Dupliquer (KCAL-141)', () => {
  it('clones the recipe and its ingredients, then opens the copy in edit mode', async () => {
    const { findByTestId, navigation } = await renderScreen();

    await fireEvent.press(await findByTestId('recipeDetail.actions.duplicate'));

    await waitFor(() => expect(mockRecipeCreate).toHaveBeenCalledTimes(1));
    expect(mockRecipeCreate).toHaveBeenCalledWith({
      name: i18n.t('recipeDetail.duplicate.copyName', { name: 'Salade de poulet' }),
      servings: 2,
      notes: undefined,
      isFavorite: true,
      ingredients: [
        { foodId: 'food-1', quantity: 150, unit: 'g' },
        { foodId: 'food-2', quantity: 100, unit: 'g' },
      ],
    });

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('RecipeForm', { recipeId: 'recipe-2' }),
    );
  });

  it('shows an inline error and does not navigate when duplication fails', async () => {
    mockRecipeCreate.mockResolvedValue({
      ok: false,
      error: { code: 'RECIPE_NOT_FOUND', message: 'boom' },
    });
    const { findByTestId, navigation } = await renderScreen();

    await fireEvent.press(await findByTestId('recipeDetail.actions.duplicate'));

    await findByTestId('recipeDetail.duplicateError');
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

describe('RecipeDetailScreen — "Ajouter au repas" (KCAL-141)', () => {
  it('is rendered disabled since the journal (Sprint 3) does not exist yet', async () => {
    const { findByTestId } = await renderScreen();

    const addToMealButton = await findByTestId('recipeDetail.actions.addToMeal');
    expect(addToMealButton.props.accessibilityState?.disabled).toBe(true);
  });
});
