import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';

import '@/i18n';

import type { Food } from '@/domain/types';
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
jest.mock('@/data/repositories', () => ({
  foodRepository: { findById: (...args: unknown[]) => mockFindById(...args) },
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

function renderSheet(food: Food) {
  return render(
    <ThemeProvider theme={theme}>
      <QuantitySheet visible target={{ kind: 'food', food }} onClose={jest.fn()} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockFindById.mockReset();
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
