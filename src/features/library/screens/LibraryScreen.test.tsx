import { BehaviorSubject } from '@nozbe/watermelondb/utils/rx';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';

import '@/i18n';

import type { Food, Recipe } from '@/domain/types';
import { ok } from '@/domain/types/result';
import type { LibraryScreenProps } from '@/navigation/types';
import { theme } from '@/ui/theme';

import { LibraryScreen } from './LibraryScreen';

// @expo/vector-icons pulls in expo-font -> expo-asset, which isn't hoisted
// to the root node_modules in this environment (nested under expo's own
// node_modules instead), breaking Node's module resolution under Jest.
// A lightweight stub is enough here: tests only assert on text/testID, never
// on the rendered glyph.
jest.mock('@expo/vector-icons', () => {
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <RNText>{name}</RNText>,
  };
});

// BottomSheet (rendered unconditionally by LibraryScreen for the delete
// dialog) uses Reanimated hooks. The package's own `mock.js` still boots the
// real worklets/native runtime (react-native-worklets), which isn't set up
// under this project's Jest config, so a small self-contained stub is used
// instead — it only needs to satisfy the three symbols BottomSheet imports.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    withTiming: (toValue: unknown) => toValue,
  };
});

// SafeAreaView/useSafeAreaInsets need a provider in the tree; the package's
// own jest mock ships as an untranspiled .tsx with no compiled entry point,
// which this project's transform config doesn't pick up from node_modules,
// so a small self-contained stub is used instead (fixed metrics, no native
// module involved).
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    __esModule: true,
    SafeAreaProvider: ({ children }: { children: import('react').ReactNode }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

const mockSearch = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockArchive = jest.fn();
const mockRecipeSearch = jest.fn();
const mockRecipeUpdate = jest.fn();
const mockFindUsagesByFoodId = jest.fn();

jest.mock('@/data/repositories', () => ({
  foodRepository: {
    search: (query: string) => mockSearch(query),
    update: (id: string, input: unknown) => mockUpdate(id, input),
    delete: (id: string) => mockDelete(id),
    archive: (id: string) => mockArchive(id),
    findById: jest.fn(),
    create: jest.fn(),
  },
  recipeRepository: {
    search: (query: string) => mockRecipeSearch(query),
    update: (id: string, input: unknown) => mockRecipeUpdate(id, input),
    findUsagesByFoodId: (foodId: string) => mockFindUsagesByFoodId(foodId),
    findById: jest.fn(),
    create: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
  },
}));

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Pomme',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
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
    name: 'Salade de quinoa',
    servings: 2,
    isFavorite: false,
    isArchived: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// `render` from @testing-library/react-native v14 is async (it awaits the
// initial `act()` flush internally), so every call site must await it —
// otherwise `screen` queries run before the tree is committed.
async function renderLibraryScreen() {
  const navigation = { navigate: jest.fn() } as unknown as LibraryScreenProps['navigation'];
  const route = {
    key: 'Library',
    name: 'Library',
    params: undefined,
  } as LibraryScreenProps['route'];

  const utils = await render(
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <LibraryScreen navigation={navigation} route={route} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  return { ...utils, navigation };
}

describe('LibraryScreen', () => {
  let foodsSubject: BehaviorSubject<Food[]>;
  let recipesSubject: BehaviorSubject<Recipe[]>;

  beforeEach(() => {
    jest.clearAllMocks();
    foodsSubject = new BehaviorSubject<Food[]>([]);
    recipesSubject = new BehaviorSubject<Recipe[]>([]);
    mockSearch.mockImplementation(() => foodsSubject);
    mockUpdate.mockResolvedValue(ok(makeFood()));
    mockDelete.mockResolvedValue(ok(undefined));
    mockArchive.mockResolvedValue(ok(undefined));
    mockRecipeSearch.mockImplementation(() => recipesSubject);
    mockRecipeUpdate.mockResolvedValue(ok(makeRecipe()));
    mockFindUsagesByFoodId.mockResolvedValue([]);
  });

  it('shows the empty-library state (KCAL-108) when there are no foods and no search', async () => {
    await renderLibraryScreen();

    expect(screen.getByText('Ta bibliothèque est vide')).toBeTruthy();
    expect(screen.getByTestId('library.empty.primaryCta')).toBeTruthy();
  });

  it('creating from the empty state navigates to FoodForm in create mode', async () => {
    const { navigation } = await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.empty.primaryCta'));

    expect(navigation.navigate).toHaveBeenCalledWith('FoodForm');
  });

  it('renders the food list and hero counts from the observed search result', async () => {
    foodsSubject.next([
      makeFood({ id: 'food-1', name: 'Pomme', isFavorite: false }),
      makeFood({ id: 'food-2', name: 'Yaourt nature', isFavorite: true }),
    ]);

    await renderLibraryScreen();

    expect(screen.getByText('Pomme')).toBeTruthy();
    expect(screen.getByText('Yaourt nature')).toBeTruthy();
    // Hero: 2 aliments, 0 recettes, 1 favori.
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('debounces the search field and calls foodRepository.search with the typed query', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    await renderLibraryScreen();

    mockSearch.mockClear();
    await fireEvent.changeText(screen.getByTestId('library.searchField'), 'poulet');

    // Not called yet: debounce hasn't elapsed.
    expect(mockSearch).not.toHaveBeenCalledWith('poulet');

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('poulet');
    });
  });

  it('filters the food list client-side when the ★ Favoris chip is selected (KCAL-104)', async () => {
    foodsSubject.next([
      makeFood({ id: 'food-1', name: 'Pomme', isFavorite: false }),
      makeFood({ id: 'food-2', name: 'Yaourt nature', isFavorite: true }),
    ]);

    await renderLibraryScreen();

    expect(screen.getByText('Pomme')).toBeTruthy();
    expect(screen.getByText('Yaourt nature')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('library.filter.favorites'));

    expect(screen.queryByText('Pomme')).toBeNull();
    expect(screen.getByText('Yaourt nature')).toBeTruthy();
  });

  it('the Recettes chip hides foods but keeps recipes (KCAL-143)', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    recipesSubject.next([makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa' })]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.filter.recipes'));

    expect(screen.queryByText('Pomme')).toBeNull();
    expect(screen.getByText('Salade de quinoa')).toBeTruthy();
  });

  it('renders the recipe list from the observed search result (KCAL-142)', async () => {
    recipesSubject.next([makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa', servings: 2 })]);

    await renderLibraryScreen();

    expect(screen.getByText('Salade de quinoa')).toBeTruthy();
  });

  it('tapping a recipe card navigates to RecipeDetail with the recipeId (KCAL-142)', async () => {
    recipesSubject.next([makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa' })]);
    const { navigation } = await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.recipeCard.recipe-1'));

    expect(navigation.navigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'recipe-1' });
  });

  it('the "+" button on the Recettes section navigates to RecipeForm in create mode', async () => {
    recipesSubject.next([makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa' })]);
    const { navigation } = await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.addRecipeButton'));

    expect(navigation.navigate).toHaveBeenCalledWith('RecipeForm');
  });

  it('toggles recipe favorite inline via recipeRepository.update on star tap (KCAL-144)', async () => {
    recipesSubject.next([
      makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa', isFavorite: false }),
    ]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.recipeCard.recipe-1.favorite'));

    await waitFor(() => {
      expect(mockRecipeUpdate).toHaveBeenCalledWith('recipe-1', { isFavorite: true });
    });
  });

  it('the HeroCard recipe count reflects the observed recipe search result (KCAL-143)', async () => {
    recipesSubject.next([
      makeRecipe({ id: 'recipe-1', name: 'Salade de quinoa' }),
      makeRecipe({ id: 'recipe-2', name: 'Soupe de potiron' }),
    ]);

    await renderLibraryScreen();

    // Hero: 0 aliments, 2 recettes, 0 favoris.
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('toggles favorite inline via foodRepository.update on star tap (KCAL-106)', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme', isFavorite: false })]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.foodCard.food-1.favorite'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('food-1', { isFavorite: true });
    });
  });

  it('tapping a food card navigates to FoodForm in edit mode with the foodId', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    const { navigation } = await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.foodCard.food-1'));

    expect(navigation.navigate).toHaveBeenCalledWith('FoodForm', { foodId: 'food-1' });
  });

  it('deletes a food after confirming the dialog (KCAL-119, not-in-use branch)', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.foodCard.food-1.delete'));
    await fireEvent.press(screen.getByTestId('library.deleteDialog.confirm'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('food-1');
    });
  });

  it('cancelling the delete dialog does not call foodRepository.delete', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.foodCard.food-1.delete'));
    await fireEvent.press(screen.getByTestId('library.deleteDialog.cancel'));

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('shows the "in use" branch (Archiver) when the food is referenced by a recipe (KCAL-145)', async () => {
    foodsSubject.next([makeFood({ id: 'food-1', name: 'Pomme' })]);
    mockFindUsagesByFoodId.mockResolvedValue([
      { id: 'ri-1', recipeId: 'recipe-1', foodId: 'food-1', quantity: 100, unit: 'g' },
    ]);
    await renderLibraryScreen();

    await fireEvent.press(screen.getByTestId('library.foodCard.food-1.delete'));

    await waitFor(() => {
      expect(mockFindUsagesByFoodId).toHaveBeenCalledWith('food-1');
      expect(screen.getByTestId('library.deleteDialog.archive')).toBeTruthy();
    });

    await fireEvent.press(screen.getByTestId('library.deleteDialog.archive'));

    await waitFor(() => {
      expect(mockArchive).toHaveBeenCalledWith('food-1');
    });
  });
});
