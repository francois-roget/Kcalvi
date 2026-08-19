import { BehaviorSubject } from '@nozbe/watermelondb/utils/rx';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import type { Food, Recipe } from '@/domain/types';
import type { RecipeFormScreenProps } from '@/navigation/types';
import { ThemeProvider } from '@/bootstrap/providers/ThemeProvider';
import { formatInteger } from '@/utils/format';

import { RecipeFormScreen } from './RecipeFormScreen';

// @expo/vector-icons pulls in expo-font -> expo-asset, which isn't hoisted to the root
// node_modules in this environment, breaking Node's module resolution under Jest (same
// issue documented in LibraryScreen.test.tsx). RecipeFormScreen renders an Ionicons
// trash glyph per ingredient row, so the same lightweight stub is needed here.
jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <RNText>{name}</RNText>,
  };
});

// BottomSheet (the ingredient picker) is always mounted by this screen and calls
// Reanimated hooks (useSharedValue/useAnimatedStyle) unconditionally, even while
// `visible` is false -- the package's own jest mock still boots the real worklets
// runtime, which isn't set up under this project's Jest config (see LibraryScreen.test.tsx),
// so a small self-contained stub is used instead.
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

// RecipeFormScreen imports `database` (the real WatermelonDB SQLiteAdapter instance) at
// module scope for its edit-mode load (getRecipeWithIngredients). Constructing the real
// adapter has native/JSI side effects at import time that don't work under Jest, so it's
// swapped for an inert stub -- none of these tests exercise edit mode.
jest.mock('@/data/database', () => ({ database: {} }));

jest.mock('@/data/repositories', () => ({
  foodRepository: {
    search: (query: string) => mockFoodSearch(query),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  recipeRepository: {
    search: jest.fn(),
    findById: jest.fn(),
    create: (input: unknown) => mockRecipeCreate(input),
    update: (id: string, input: unknown) => mockRecipeUpdate(id, input),
    archive: jest.fn(),
    delete: jest.fn(),
    findUsagesByFoodId: jest.fn(),
  },
}));

const mockFoodSearch = jest.fn();
const mockRecipeCreate = jest.fn();
const mockRecipeUpdate = jest.fn();

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Oeuf',
    calories: 200,
    protein: 12,
    carbs: 1,
    fat: 14,
    referenceQuantity: 100,
    referenceUnit: 'g',
    // 1 unit == 50 g, so "3 unit" and "150 g" are the exact same underlying quantity --
    // the equivalence the KCAL-130 conversion test relies on.
    servingQuantity: 50,
    servingUnit: 'unit',
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
    name: 'Ma recette',
    servings: 2,
    isFavorite: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

async function renderScreen(params?: { recipeId: string }) {
  const navigation = { goBack: jest.fn() } as unknown as RecipeFormScreenProps['navigation'];
  const route = {
    key: 'RecipeForm-test',
    name: 'RecipeForm',
    params,
  } as unknown as RecipeFormScreenProps['route'];

  const utils = await render(
    <ThemeProvider>
      <RecipeFormScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );

  return { ...utils, navigation };
}

/** Opens the ingredient picker, selects `food` from the search results, and lands on the
 * quantity step. `foodRepository.search` is observed from mount (query `''`), so the
 * results are already populated by the time the picker opens -- no debounce to wait out. */
async function openQuantityStepFor(utils: Awaited<ReturnType<typeof renderScreen>>, food: Food) {
  const { getByTestId, findByTestId } = utils;
  await fireEvent.press(getByTestId('recipeForm.addIngredient'));
  await fireEvent.press(await findByTestId(`recipeForm.ingredientPicker.result.${food.id}`));
  await findByTestId('recipeForm.ingredientPicker.quantity');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFoodSearch.mockImplementation(() => new BehaviorSubject<Food[]>([makeFood()]));
  mockRecipeCreate.mockResolvedValue({ ok: true, value: makeRecipe() });
  mockRecipeUpdate.mockResolvedValue({ ok: true, value: makeRecipe() });
});

describe('RecipeFormScreen — total recalculation (KCAL-130/131/134)', () => {
  it('adds an ingredient entered in the reference unit and recalculates the total', async () => {
    const food = makeFood();
    const utils = await renderScreen();
    const { getByTestId, findAllByText } = utils;

    await openQuantityStepFor(utils, food);
    await fireEvent.changeText(getByTestId('recipeForm.ingredientPicker.quantityField'), '150');
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.confirm'));

    // 150 g at the food's reference of 100 g / 200 kcal -> 300 kcal total, 1 portion by default.
    await waitFor(() =>
      expect(getByTestId('recipeForm.totalWeight').props.value).toBe(formatInteger(150)),
    );
    // "300 kcal" appears twice with a single ingredient: once on its row, once as the
    // per-portion total (1 portion by default) -- both must be present.
    const kcalMatches = await findAllByText(
      i18n.t('recipeForm.perPortion.kcalValue', { value: formatInteger(300) }),
    );
    expect(kcalMatches).toHaveLength(2);
  });

  it('adds the equivalent quantity entered in portions and produces the same total (KCAL-130 conversion)', async () => {
    const food = makeFood();
    const utils = await renderScreen();
    const { getByTestId, findAllByText } = utils;

    await openQuantityStepFor(utils, food);
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.mode.servings'));
    // 3 units * 50 g/unit == 150 g -- the exact reference-unit quantity used in the test above.
    await fireEvent.changeText(getByTestId('recipeForm.ingredientPicker.quantityField'), '3');
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.confirm'));

    await waitFor(() =>
      expect(getByTestId('recipeForm.totalWeight').props.value).toBe(formatInteger(150)),
    );
    const kcalMatches = await findAllByText(
      i18n.t('recipeForm.perPortion.kcalValue', { value: formatInteger(300) }),
    );
    expect(kcalMatches).toHaveLength(2);
  });

  it('removes an ingredient and recalculates the total back down', async () => {
    const food = makeFood();
    const utils = await renderScreen();
    const { getByTestId, findByTestId, findByText } = utils;

    await openQuantityStepFor(utils, food);
    await fireEvent.changeText(getByTestId('recipeForm.ingredientPicker.quantityField'), '150');
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.confirm'));

    await waitFor(() =>
      expect(getByTestId('recipeForm.totalWeight').props.value).toBe(formatInteger(150)),
    );

    const deleteButton = await findByTestId(/^recipeForm\.ingredient\..*\.delete$/);
    await fireEvent.press(deleteButton);

    await waitFor(() =>
      expect(getByTestId('recipeForm.totalWeight').props.value).toBe(formatInteger(0)),
    );
    await findByText(i18n.t('recipeForm.ingredients.empty'));
  });
});

describe('RecipeFormScreen — submit validation (KCAL-135)', () => {
  it('blocks submit and shows a root error when there are no ingredients', async () => {
    const { getByTestId, findByText, navigation } = await renderScreen();

    await fireEvent.changeText(getByTestId('recipeForm.name'), 'Salade de quinoa');
    await fireEvent.press(getByTestId('recipeForm.submit'));

    await findByText(i18n.t('recipeForm.errors.noIngredients'));
    expect(mockRecipeCreate).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('rejects a negative quantity in the picker and does not add the ingredient', async () => {
    const food = makeFood();
    const utils = await renderScreen();
    const { getByTestId, findByText } = utils;

    await openQuantityStepFor(utils, food);
    await fireEvent.changeText(getByTestId('recipeForm.ingredientPicker.quantityField'), '-10');
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.confirm'));

    await findByText(i18n.t('recipeForm.errors.negativeValue'));
    // The picker stays open (confirm didn't close it) and no ingredient was added.
    expect(getByTestId('recipeForm.ingredientPicker.quantity')).toBeTruthy();

    // Backing out to the underlying form still shows the empty state, not a stray row.
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.cancel'));
    await findByText(i18n.t('recipeForm.ingredients.empty'));
    expect(mockRecipeCreate).not.toHaveBeenCalled();
  });

  it('submits the expected payload and navigates back on success', async () => {
    const food = makeFood();
    const utils = await renderScreen();
    const { getByTestId, navigation } = utils;

    await fireEvent.changeText(getByTestId('recipeForm.name'), 'Salade de quinoa');
    await fireEvent.changeText(getByTestId('recipeForm.servings'), '2');

    await openQuantityStepFor(utils, food);
    await fireEvent.changeText(getByTestId('recipeForm.ingredientPicker.quantityField'), '150');
    await fireEvent.press(getByTestId('recipeForm.ingredientPicker.confirm'));

    await waitFor(() =>
      expect(getByTestId('recipeForm.totalWeight').props.value).toBe(formatInteger(150)),
    );

    await fireEvent.press(getByTestId('recipeForm.submit'));

    await waitFor(() => expect(mockRecipeCreate).toHaveBeenCalledTimes(1));
    expect(mockRecipeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Salade de quinoa',
        servings: 2,
        ingredients: [{ foodId: food.id, quantity: 150, unit: 'g' }],
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
