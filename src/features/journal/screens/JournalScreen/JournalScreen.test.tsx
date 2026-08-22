import { BehaviorSubject } from '@nozbe/watermelondb/utils/rx';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';

import '@/i18n';

import type { DiaryEntry, UserProfile } from '@/domain/types';
import { err, ok } from '@/domain/types/result';
import type { JournalScreenProps } from '@/navigation/types';
import { theme } from '@/ui/theme';
import { ToastProvider } from '@/ui/Toast';

import { JournalScreen } from './JournalScreen';

// See LibraryScreen.test.tsx for why each of these is stubbed rather than using the packages'
// own mocks.
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
    FadeInDown: { duration: () => ({ springify: () => ({ damping: () => ({}) }) }) },
    FadeOutDown: { duration: () => ({}) },
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

jest.mock('@/data/database', () => ({ database: {} }));

const mockProfileSubject = new BehaviorSubject<UserProfile | null>(null);
// One subject per day key, so selecting another day genuinely swaps data sources -- the same
// thing observeByDate does against SQLite.
const mockDaySubjects = new Map<string, BehaviorSubject<DiaryEntry[]>>();

/** Local-day key, matching how the screen and DayStrip identify a day. */
function mockDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const mockUpdateEntry = jest.fn();
const mockDeleteEntry = jest.fn();

jest.mock('@/data/repositories', () => ({
  profileRepository: { observe: () => mockProfileSubject },
  foodRepository: { findById: jest.fn().mockResolvedValue({ ok: false }) },
  recipeRepository: { findById: jest.fn().mockResolvedValue({ ok: false }) },
  diaryEntryRepository: {
    observeByDate: (date: Date) => {
      // `require`d inside the factory: jest.mock factories may not close over imported
      // bindings, only over `mock`-prefixed variables and lazily required modules.
      const { BehaviorSubject: Subject } = require('@nozbe/watermelondb/utils/rx');
      const key = mockDayKey(date);
      if (!mockDaySubjects.has(key)) {
        mockDaySubjects.set(key, new Subject([]));
      }
      return mockDaySubjects.get(key);
    },
    update: (...args: unknown[]) => mockUpdateEntry(...args),
    delete: (...args: unknown[]) => mockDeleteEntry(...args),
  },
}));

const PROFILE = { id: 'p-1', name: 'François', dailyCalorieGoal: 2000 } as UserProfile;

function entry(partial: Partial<DiaryEntry>): DiaryEntry {
  return {
    id: 'e-1',
    mealType: 'LUNCH',
    label: 'Riz',
    calories: 200,
    protein: 4,
    carbs: 42,
    fat: 1,
    quantity: 150,
    unit: 'g',
    ...partial,
  } as DiaryEntry;
}

function setEntriesFor(date: Date, entries: DiaryEntry[]) {
  const key = mockDayKey(date);
  if (!mockDaySubjects.has(key)) {
    mockDaySubjects.set(key, new BehaviorSubject<DiaryEntry[]>([]));
  }
  mockDaySubjects.get(key)!.next(entries);
}

const navigation = { navigate: jest.fn(), getParent: () => ({ navigate: jest.fn() }) };
const route = { key: 'Journal-1', name: 'Journal' as const, params: undefined };

function renderScreen() {
  return render(
    // The screen confirms its F14 actions with a toast, so it needs the real provider.
    //
    // Running this file alone prints Jest's "did not exit one second after" notice: the
    // provider's 2.2s auto-dismiss timeout isn't cleared on unmount. Harmless in the app (the
    // provider sits at the root and never unmounts) and harmless in the full run, but worth
    // knowing before chasing it as a leak in this test.
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <JournalScreen
          navigation={navigation as unknown as JournalScreenProps['navigation']}
          route={route as JournalScreenProps['route']}
        />
      </ToastProvider>
    </ThemeProvider>,
  );
}

const TODAY = new Date();

beforeEach(() => {
  mockProfileSubject.next(PROFILE);
  mockDaySubjects.clear();
  mockUpdateEntry.mockReset().mockResolvedValue(ok({}));
  mockDeleteEntry.mockReset().mockResolvedValue(ok({}));
  navigation.navigate.mockReset();
});

describe('JournalScreen (KCAL-199)', () => {
  it('splits the day into its four meal sections', async () => {
    renderScreen();

    setEntriesFor(TODAY, [
      entry({ id: 'e-1', mealType: 'BREAKFAST', label: 'Café', calories: 5 }),
      entry({ id: 'e-2', mealType: 'DINNER', label: 'Soupe', calories: 300 }),
    ]);

    await waitFor(() => expect(screen.getByText('Café')).toBeTruthy());
    expect(screen.getByText('Soupe')).toBeTruthy();

    // Per-meal totals, and only for the meals that actually have entries.
    expect(screen.getByTestId('journal.mealTotal.BREAKFAST')).toHaveTextContent('5 kcal');
    expect(screen.getByTestId('journal.mealTotal.DINNER')).toHaveTextContent('300 kcal');
    expect(screen.queryByTestId('journal.mealTotal.LUNCH')).toBeNull();
  });

  it('switches the observed day when another one is picked in the DayStrip', async () => {
    // The strip covers the current week, so "another day" is any day in it that isn't today.
    const otherDay = new Date(TODAY);
    otherDay.setDate(otherDay.getDate() + (TODAY.getDay() === 1 ? 1 : -1));

    setEntriesFor(TODAY, [entry({ id: 'today-1', label: "Aujourd'hui" })]);
    setEntriesFor(otherDay, [entry({ id: 'other-1', label: 'Un autre jour' })]);

    renderScreen();
    await waitFor(() => expect(screen.getByText("Aujourd'hui")).toBeTruthy());

    fireEvent.press(screen.getByTestId(`journal.day.${mockDayKey(otherDay)}`));

    await waitFor(() => expect(screen.getByText('Un autre jour')).toBeTruthy());
    expect(screen.queryByText("Aujourd'hui")).toBeNull();
  });

  it('shows the status pill against the goal', async () => {
    renderScreen();
    setEntriesFor(TODAY, [entry({ id: 'e-1', calories: 500 })]);

    await waitFor(() =>
      expect(screen.getByTestId('journal.statusPill')).toHaveTextContent('Dans la cible'),
    );

    // Past the goal the same pill flips -- the shared isOverGoal threshold (KCAL-188).
    setEntriesFor(TODAY, [entry({ id: 'e-1', calories: 2500 })]);
    await waitFor(() =>
      expect(screen.getByTestId('journal.statusPill')).toHaveTextContent('Au-dessus'),
    );
  });

  describe('F14 actions', () => {
    async function openActions() {
      renderScreen();
      setEntriesFor(TODAY, [entry({ id: 'e-1', label: 'Riz' })]);
      await waitFor(() => expect(screen.getByText('Riz')).toBeTruthy());
      fireEvent.press(screen.getByText('Riz'));
      await waitFor(() => expect(screen.getByTestId('journal.entryActions')).toBeTruthy());
    }

    it('moves the entry to another meal without touching its date', async () => {
      await openActions();

      fireEvent.press(screen.getByTestId('journal.entryActions.changeMeal'));
      await waitFor(() =>
        expect(screen.getByTestId('journal.entryActions.meal.SNACK')).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId('journal.entryActions.meal.SNACK'));

      await waitFor(() => expect(mockUpdateEntry).toHaveBeenCalledTimes(1));
      // Exactly `{ mealType }`: passing `date` would re-run KCAL-169's normalization for
      // nothing, and moving a meal must never move the day.
      expect(mockUpdateEntry).toHaveBeenCalledWith('e-1', { mealType: 'SNACK' });
    });

    it('deletes only after the confirmation step', async () => {
      await openActions();

      fireEvent.press(screen.getByTestId('journal.entryActions.delete'));
      // The first tap opens the confirmation; nothing is deleted yet.
      await waitFor(() =>
        expect(screen.getByTestId('journal.entryActions.confirmDelete')).toBeTruthy(),
      );
      expect(mockDeleteEntry).not.toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('journal.entryActions.confirmDelete'));
      await waitFor(() => expect(mockDeleteEntry).toHaveBeenCalledWith('e-1'));
    });

    it('keeps the sheet open and shows why when an action fails (KCAL-153)', async () => {
      mockDeleteEntry.mockResolvedValue(err({ code: 'DIARY_ENTRY_NOT_FOUND', message: 'gone' }));

      await openActions();
      fireEvent.press(screen.getByTestId('journal.entryActions.delete'));
      await waitFor(() =>
        expect(screen.getByTestId('journal.entryActions.confirmDelete')).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId('journal.entryActions.confirmDelete'));

      // The failure is visible instead of the sheet closing as if it had worked.
      await waitFor(() => expect(screen.getByTestId('journal.entryActions.error')).toBeTruthy());
      expect(screen.getByTestId('journal.entryActions')).toBeTruthy();
    });

    it('opens AddEntry prefiltered on the meal from « + Ajouter »', async () => {
      renderScreen();
      await waitFor(() => expect(screen.getByTestId('journal.mealSection.SNACK')).toBeTruthy());

      fireEvent.press(screen.getByTestId('journal.mealSection.SNACK.add'));

      expect(navigation.navigate).toHaveBeenCalledWith(
        'AddEntry',
        expect.objectContaining({ mealType: 'SNACK' }),
      );
    });
  });
});
