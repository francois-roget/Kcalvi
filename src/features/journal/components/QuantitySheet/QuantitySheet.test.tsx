import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';

import '@/i18n';

import type { Food, Recipe } from '@/domain/types';
import { ok } from '@/domain/types/result';
import { theme } from '@/ui/theme';

import { QuantitySheet } from './QuantitySheet';

// See LibraryScreen.test.tsx for the rationale behind each of these stubs: @expo/vector-icons
// pulls in expo-font/expo-asset, Reanimated's own mock boots the real worklets runtime, and
// safe-area-context ships an untranspiled jest mock.
jest.mock('@expo/vector-icons', () => {
  const { Text: RNText } = require('react-native');
  return { Ionicons: ({ name }: { name: string }) => <RNText>{name}</RNText> };
});

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

jest.mock('@/data/database', () => ({ database: {} }));

const mockFindById = jest.fn();

const mockCreateEntry = jest.fn();
const mockUpdateFood = jest.fn();
const mockUpdateRecipe = jest.fn();
jest.mock('@/data/repositories', () => ({
  foodRepository: {
    findById: (...args: unknown[]) => mockFindById(...args),
    update: (...args: unknown[]) => mockUpdateFood(...args),
  },
  recipeRepository: { update: (...args: unknown[]) => mockUpdateRecipe(...args) },
  diaryEntryRepository: { create: (...args: unknown[]) => mockCreateEntry(...args) },
}));

const mockGetRecipeWithIngredients = jest.fn();
jest.mock('@/data/repositories/getRecipeWithIngredients', () => ({
  getRecipeWithIngredients: (...args: unknown[]) => mockGetRecipeWithIngredients(...args),
}));

const YAOURT: Food = {
  id: 'food-1',
  name: 'Yaourt nature',
  calories: 60,
  protein: 4,
  carbs: 5,
  fat: 3,
  referenceQuantity: 100,
  referenceUnit: 'g',
  isFavorite: false,
  isArchived: false,
  portions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** The three portions the full record carries, deliberately out of `position` order. */
const PORTIONS = [
  { id: 'p-large', foodId: YAOURT.id, label: '1 grand pot', quantity: 250, unit: 'g', position: 2 },
  { id: 'p-small', foodId: YAOURT.id, label: '1 petit pot', quantity: 100, unit: 'g', position: 0 },
  { id: 'p-mid', foodId: YAOURT.id, label: '1 pot', quantity: 150, unit: 'g', position: 1 },
];

const SOUPE: Recipe = {
  id: 'recipe-1',
  name: 'Soupe de potiron',
  servings: 4,
  isFavorite: false,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const onSaved = jest.fn();

function renderSheet(food: Food) {
  return render(
    <ThemeProvider theme={theme}>
      <QuantitySheet
        visible
        target={{ kind: 'food', food }}
        mealType="LUNCH"
        dayKey="2026-08-21"
        onClose={jest.fn()}
        onSaved={onSaved}
      />
    </ThemeProvider>,
  );
}

function renderRecipeSheet(recipe: Recipe) {
  return render(
    <ThemeProvider theme={theme}>
      <QuantitySheet
        visible
        target={{ kind: 'recipe', recipe }}
        mealType="DINNER"
        dayKey="2026-08-21"
        onClose={jest.fn()}
        onSaved={onSaved}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockFindById.mockReset();
  mockGetRecipeWithIngredients.mockReset();
  mockCreateEntry.mockReset().mockResolvedValue(ok({}));
  mockUpdateFood.mockReset().mockResolvedValue(ok({}));
  mockUpdateRecipe.mockReset().mockResolvedValue(ok({}));
  onSaved.mockReset();
});

describe('QuantitySheet quick portions (KCAL-179)', () => {
  it('loads portions via findById, because search() returns portions: [] (KCAL-163b)', async () => {
    // Exactly what AddEntryScreen hands over: a Food straight from foodRepository.search(),
    // which never carries portions. Without the sheet's own findById this renders no
    // quick-portion buttons at all -- silently, since an empty array is a valid Food.
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: PORTIONS }));

    renderSheet(YAOURT);

    await waitFor(() => expect(screen.getByTestId('quantitySheet.portions')).toBeTruthy());
    expect(mockFindById).toHaveBeenCalledWith(YAOURT.id);

    expect(screen.getByText('1 petit pot')).toBeTruthy();
    expect(screen.getByText('1 pot')).toBeTruthy();
    expect(screen.getByText('1 grand pot')).toBeTruthy();
  });

  it('preselects the median portion by position and converts it to the reference unit', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: PORTIONS }));

    renderSheet(YAOURT);

    // Median of the three by ascending position is "1 pot" (150 g), not the first-listed one.
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.portion.p-mid').props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      ),
    );

    // The field holds reference-unit grams, never a raw portion count: quantity must already
    // be converted by the time it reaches the write path.
    expect(screen.getByTestId('quantitySheet.quantityField').props.value).toBe('150');
    expect(screen.getByTestId('quantitySheet.kcal')).toHaveTextContent('90 kcal');
  });

  it('falls back to the reference quantity when the food has no portions', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: [] }));

    renderSheet(YAOURT);

    // `waitFor` wraps its polling in `act`, so this also flushes the findById resolution --
    // otherwise the resulting setFood lands after the test body and React reports an update
    // outside act.
    await waitFor(() => expect(mockFindById).toHaveBeenCalledWith(YAOURT.id));
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.quantityField').props.value).toBe('100'),
    );

    expect(screen.queryByTestId('quantitySheet.portions')).toBeNull();
  });
});

describe('QuantitySheet recipe mode (KCAL-180)', () => {
  // 400 kcal of ingredients over 4 servings = 100 kcal per portion.
  const RICE: Food = { ...YAOURT, id: 'food-rice', name: 'Riz', calories: 400 };

  it('counts portions and scales the per-portion value, never RM02', async () => {
    mockGetRecipeWithIngredients.mockResolvedValue(
      ok({
        recipe: SOUPE,
        items: [
          {
            ingredient: {
              id: 'ri-1',
              recipeId: SOUPE.id,
              foodId: RICE.id,
              quantity: 100,
              unit: 'g',
            },
            food: RICE,
          },
        ],
      }),
    );

    renderRecipeSheet(SOUPE);

    // Starts at one portion, so the readout equals the per-portion value itself.
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.kcal')).toHaveTextContent('100 kcal'),
    );
    expect(screen.getByTestId('quantitySheet.quantityField').props.value).toBe('1');

    // Two portions doubles it. A food would have run this through
    // calculateProportionalNutrition against a reference quantity; a recipe multiplies its
    // already-per-portion values instead (multiplyNutrition), which is the whole distinction.
    fireEvent.changeText(screen.getByTestId('quantitySheet.quantityField'), '2');
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.kcal')).toHaveTextContent('200 kcal'),
    );
  });

  it('shows no quick portions for a recipe: it is already counted in portions', async () => {
    mockGetRecipeWithIngredients.mockResolvedValue(ok({ recipe: SOUPE, items: [] }));

    renderRecipeSheet(SOUPE);

    await waitFor(() => expect(mockGetRecipeWithIngredients).toHaveBeenCalled());
    expect(screen.queryByTestId('quantitySheet.portions')).toBeNull();
    expect(mockFindById).not.toHaveBeenCalled();
  });
});

describe('QuantitySheet write path (KCAL-181)', () => {
  it('copies the nutrition values and the label onto the entry (RM16)', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: PORTIONS }));

    renderSheet(YAOURT);
    await waitFor(() => expect(screen.getByTestId('quantitySheet.portions')).toBeTruthy());

    fireEvent.press(screen.getByTestId('quantitySheet.submit'));

    await waitFor(() => expect(mockCreateEntry).toHaveBeenCalledTimes(1));
    expect(mockCreateEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        mealType: 'LUNCH',
        // The median portion ("1 pot", 150 g) is preselected, so the entry carries the
        // converted reference-unit quantity and records which portion it came from.
        quantity: 150,
        unit: 'g',
        source: { kind: 'food', foodId: YAOURT.id, portionId: 'p-mid' },
        // Copied, not referenced: renaming or deleting the food later must not change this.
        label: 'Yaourt nature',
        calories: 90,
      }),
    );
    // Local midnight, not UTC: parseISO on a date-only key.
    expect(mockCreateEntry.mock.calls[0][0].date).toEqual(new Date(2026, 7, 21));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onSaved.mock.calls[0][0]).toContain('Yaourt nature');
  });

  it("writes a recipe entry in portions with unit 'portion'", async () => {
    const rice: Food = { ...YAOURT, id: 'food-rice', name: 'Riz', calories: 400 };
    mockGetRecipeWithIngredients.mockResolvedValue(
      ok({
        recipe: SOUPE,
        items: [
          {
            ingredient: {
              id: 'ri-1',
              recipeId: SOUPE.id,
              foodId: rice.id,
              quantity: 100,
              unit: 'g',
            },
            food: rice,
          },
        ],
      }),
    );

    renderRecipeSheet(SOUPE);
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.kcal')).toHaveTextContent('100 kcal'),
    );

    fireEvent.press(screen.getByTestId('quantitySheet.submit'));

    await waitFor(() => expect(mockCreateEntry).toHaveBeenCalledTimes(1));
    expect(mockCreateEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        mealType: 'DINNER',
        quantity: 1,
        unit: 'portion',
        source: { kind: 'recipe', recipeId: SOUPE.id },
        label: 'Soupe de potiron',
        calories: 100,
      }),
    );
  });

  it('refuses an empty quantity (RM14) instead of writing a zero entry', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: [] }));

    renderSheet(YAOURT);
    await waitFor(() => expect(mockFindById).toHaveBeenCalled());

    fireEvent.changeText(screen.getByTestId('quantitySheet.quantityField'), '');
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.quantityField').props.value).toBe(''),
    );
    fireEvent.press(screen.getByTestId('quantitySheet.submit'));

    await waitFor(() => expect(screen.getByText('Indique une quantité.')).toBeTruthy());
    expect(mockCreateEntry).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('leaves the favorite flag alone when the toggle is untouched', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: [] }));

    renderSheet(YAOURT);
    await waitFor(() => expect(mockFindById).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('quantitySheet.submit'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(mockUpdateFood).not.toHaveBeenCalled();
  });

  it('applies the favorite flag when the toggle was switched on', async () => {
    mockFindById.mockResolvedValue(ok({ ...YAOURT, portions: [] }));

    renderSheet(YAOURT);
    await waitFor(() => expect(mockFindById).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('quantitySheet.favorite'));
    // The submit handler closes over the toggle's value, so wait for the flip to render
    // before pressing -- otherwise the press runs the pre-toggle closure.
    await waitFor(() =>
      expect(screen.getByTestId('quantitySheet.favorite').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true }),
      ),
    );
    fireEvent.press(screen.getByTestId('quantitySheet.submit'));

    await waitFor(() =>
      expect(mockUpdateFood).toHaveBeenCalledWith(YAOURT.id, { isFavorite: true }),
    );
  });
});
