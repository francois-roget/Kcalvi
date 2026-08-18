import { fireEvent, render, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import type { Food } from '@/domain/types';
import type { FoodFormScreenProps } from '@/navigation/types';
import { ThemeProvider } from '@/bootstrap/providers/ThemeProvider';

import { FoodFormScreen } from './FoodFormScreen';

jest.mock('@/data/repositories', () => ({
  foodRepository: {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  },
}));

// The real Toggle (favorite field) pulls in Reanimated/Worklets, whose native module
// isn't available under Jest and whose own official mock currently re-triggers the same
// native init in this Reanimated/Worklets version combo. Toggle behavior isn't part of
// KCAL-122's scope (validation, submit success/error, edit preload), so it's swapped for
// a plain Pressable test double here rather than pulled into this screen's test run.
jest.mock('@/ui/Toggle', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text: RNText } = require('react-native');
  return {
    __esModule: true,
    default: ({
      value,
      onValueChange,
    }: {
      value: boolean;
      onValueChange: (v: boolean) => void;
    }) => (
      <Pressable
        testID="foodForm.favoriteToggle"
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={() => onValueChange(!value)}
      >
        <RNText>{value ? 'on' : 'off'}</RNText>
      </Pressable>
    ),
  };
});

const { foodRepository } = jest.requireMock('@/data/repositories') as {
  foodRepository: {
    create: jest.Mock;
    update: jest.Mock;
    findById: jest.Mock;
  };
};

function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-1',
    name: 'Yaourt nature',
    calories: 60,
    protein: 5,
    carbs: 4,
    fat: 2,
    referenceQuantity: 100,
    referenceUnit: 'g',
    isFavorite: false,
    isArchived: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

async function renderScreen(params?: { foodId: string }) {
  const navigation = { goBack: jest.fn() } as unknown as FoodFormScreenProps['navigation'];
  const route = {
    key: 'FoodForm-test',
    name: 'FoodForm',
    params,
  } as unknown as FoodFormScreenProps['route'];

  const utils = await render(
    <ThemeProvider>
      <FoodFormScreen navigation={navigation} route={route} />
    </ThemeProvider>,
  );

  return { ...utils, navigation };
}

beforeEach(() => {
  jest.clearAllMocks();
  foodRepository.create.mockResolvedValue({ ok: true, value: makeFood() });
  foodRepository.update.mockResolvedValue({ ok: true, value: makeFood() });
});

describe('FoodFormScreen — validation (KCAL-116)', () => {
  it('shows a field error and does not submit when the name is missing', async () => {
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('foodForm.calories'), '100');
    await fireEvent.press(getByTestId('foodForm.submit'));

    await findByText(i18n.t('foodForm.errors.nameRequired'));
    expect(foodRepository.create).not.toHaveBeenCalled();
  });

  it('shows a field error and does not submit when calories is negative', async () => {
    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('foodForm.name'), 'Yaourt nature');
    await fireEvent.changeText(getByTestId('foodForm.calories'), '-5');
    await fireEvent.press(getByTestId('foodForm.submit'));

    await findByText(
      i18n.t('foodForm.errors.negativeValue', { field: i18n.t('foodForm.calories') }),
    );
    expect(foodRepository.create).not.toHaveBeenCalled();
  });
});

describe('FoodFormScreen — create (KCAL-117)', () => {
  it('submits the expected payload and navigates back on success', async () => {
    const { getByTestId, navigation } = await renderScreen();

    await fireEvent.changeText(getByTestId('foodForm.name'), 'Yaourt nature');
    await fireEvent.changeText(getByTestId('foodForm.calories'), '60');
    await fireEvent.changeText(getByTestId('foodForm.protein'), '5');
    await fireEvent.press(getByTestId('foodForm.submit'));

    await waitFor(() => expect(foodRepository.create).toHaveBeenCalledTimes(1));

    expect(foodRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Yaourt nature',
        calories: 60,
        protein: 5,
        carbs: 0,
        fat: 0,
        referenceQuantity: 100,
        referenceUnit: 'g',
        isFavorite: false,
      }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('surfaces a repository validation error on the calories field instead of navigating', async () => {
    foodRepository.create.mockResolvedValueOnce({
      ok: false,
      error: { code: 'NEGATIVE_VALUE', message: 'calories must not be negative' },
    });

    const { getByTestId, findByText, navigation } = await renderScreen();

    await fireEvent.changeText(getByTestId('foodForm.name'), 'Yaourt nature');
    await fireEvent.changeText(getByTestId('foodForm.calories'), '60');
    await fireEvent.press(getByTestId('foodForm.submit'));

    await findByText(
      i18n.t('foodForm.errors.negativeValue', { field: i18n.t('foodForm.calories') }),
    );
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});

describe('FoodFormScreen — edit mode (KCAL-118)', () => {
  it('preloads the food via findById and submits through update', async () => {
    foodRepository.findById.mockResolvedValue({
      ok: true,
      value: makeFood({ id: 'food-1', name: 'Riz basmati', calories: 130 }),
    });

    const { getByTestId, navigation } = await renderScreen({ foodId: 'food-1' });

    await waitFor(() => expect(foodRepository.findById).toHaveBeenCalledWith('food-1'));
    await waitFor(() => expect(getByTestId('foodForm.name').props.value).toBe('Riz basmati'));
    expect(getByTestId('foodForm.calories').props.value).toBe('130');

    await fireEvent.press(getByTestId('foodForm.submit'));

    await waitFor(() => expect(foodRepository.update).toHaveBeenCalledTimes(1));
    expect(foodRepository.update).toHaveBeenCalledWith(
      'food-1',
      expect.objectContaining({ name: 'Riz basmati', calories: 130 }),
    );
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
