import { BehaviorSubject } from '@nozbe/watermelondb/utils/rx';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';

import '@/i18n';

import type { DiaryEntry, UserProfile } from '@/domain/types';
import type { TodayScreenProps } from '@/navigation/types';
import { theme } from '@/ui/theme';

import { TodayScreen } from './TodayScreen';

// See LibraryScreen.test.tsx for why each of these is stubbed rather than using the packages'
// own mocks (expo-font/expo-asset resolution, Reanimated's worklets runtime, an untranspiled
// safe-area jest mock).
jest.mock('@expo/vector-icons', () => {
  const { Text: RNText } = require('react-native');
  return { Ionicons: ({ name }: { name: string }) => <RNText>{name}</RNText> };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (component: unknown) => component },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    useAnimatedProps: (factory: () => Record<string, unknown>) => factory(),
    withTiming: (toValue: unknown) => toValue,
    Easing: { bezier: () => undefined },
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

// react-native-svg renders no text, so the gauge is asserted through its own overlay Text.
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View };
});

jest.mock('@/data/database', () => ({ database: {} }));

const mockProfileSubject = new BehaviorSubject<UserProfile | null>(null);
const mockEntriesSubject = new BehaviorSubject<DiaryEntry[]>([]);

jest.mock('@/data/repositories', () => ({
  profileRepository: { observe: () => mockProfileSubject },
  diaryEntryRepository: { observeByDate: () => mockEntriesSubject },
}));

const PROFILE = {
  id: 'profile-1',
  name: 'François',
  dailyCalorieGoal: 2000,
  proteinGoal: 130,
  carbGoal: 220,
  fatGoal: 55,
} as UserProfile;

function entry(partial: Partial<DiaryEntry>): DiaryEntry {
  return {
    mealType: 'LUNCH',
    label: 'Riz',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    quantity: 100,
    unit: 'g',
    ...partial,
  } as DiaryEntry;
}

const navigation = { navigate: jest.fn(), getParent: () => ({ navigate: jest.fn() }) };
// The screen reads nothing off `route`, but its props type requires it.
const route = { key: 'Today-1', name: 'Today' as const, params: undefined };

function renderScreen() {
  return render(
    <ThemeProvider theme={theme}>
      <TodayScreen
        navigation={navigation as unknown as TodayScreenProps['navigation']}
        route={route as TodayScreenProps['route']}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockProfileSubject.next(PROFILE);
  mockEntriesSubject.next([]);
});

describe('TodayScreen (KCAL-198)', () => {
  it('shows the empty-day state before anything is logged (2s)', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByText('Journée à démarrer')).toBeTruthy());

    // All four meal cards render, all empty, so the day's real shape is there from the start.
    expect(screen.getByTestId('today.mealCard.BREAKFAST')).toBeTruthy();
    expect(screen.getByTestId('today.mealCard.LUNCH')).toBeTruthy();
    expect(screen.getByTestId('today.mealCard.SNACK')).toBeTruthy();
    expect(screen.getByTestId('today.mealCard.DINNER')).toBeTruthy();
  });

  it('updates the day total from a new emission, with no manual invalidation (RM04)', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Journée à démarrer')).toBeTruthy());

    // TECHNICAL_SPECS §5.3: the observed query is the only refresh mechanism -- the screen
    // never re-fetches or invalidates a cache, so a new emission is the whole update path.
    mockEntriesSubject.next([
      entry({ id: 'e-1', mealType: 'BREAKFAST', label: 'Café', calories: 250 }),
      entry({ id: 'e-2', mealType: 'LUNCH', label: 'Riz', calories: 450 }),
    ]);

    // 700 appears twice by design: the gauge's own value and the « Consommé » tile.
    await waitFor(() => expect(screen.getAllByText('700')).toHaveLength(2));
    // Remaining = goal - net (RM07), with burned still 0 until Sprint 5.
    expect(screen.getByText('1 300')).toBeTruthy();
    expect(screen.queryByText('Journée à démarrer')).toBeNull();
  });

  it('aggregates the three macros across meals against the profile goals', async () => {
    renderScreen();

    mockEntriesSubject.next([
      entry({ id: 'e-1', mealType: 'BREAKFAST', calories: 250, protein: 12.5, carbs: 30, fat: 8 }),
      entry({ id: 'e-2', mealType: 'DINNER', calories: 450, protein: 27.5, carbs: 20, fat: 12 }),
    ]);

    await waitFor(() => expect(screen.getByTestId('today.macros')).toBeTruthy());

    // Summed across both meals and rendered at one decimal (fr-BE), against the profile goals.
    await waitFor(() => expect(screen.getByText('40,0')).toBeTruthy());
    expect(screen.getByText('50,0')).toBeTruthy();
    expect(screen.getByText('20,0')).toBeTruthy();
    expect(screen.getByText('/130 g')).toBeTruthy();
  });

  it('groups each entry under its own meal card', async () => {
    renderScreen();

    mockEntriesSubject.next([
      entry({ id: 'e-1', mealType: 'BREAKFAST', label: 'Café', calories: 5 }),
      entry({ id: 'e-2', mealType: 'DINNER', label: 'Soupe', calories: 300 }),
    ]);

    await waitFor(() => expect(screen.getByText('Café')).toBeTruthy());
    expect(screen.getByText('Soupe')).toBeTruthy();
    // Untouched meals keep their empty line rather than borrowing another meal's entries.
    expect(screen.getAllByText("Rien pour l'instant")).toHaveLength(2);
  });
});
