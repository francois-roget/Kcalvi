import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ActivityLevel, MealType, Sex } from '@/domain/types';

export type OnboardingProfileDraft = {
  firstName: string;
  sex: Sex;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: ActivityLevel;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileSetup: undefined;
  GoalSetup: OnboardingProfileDraft;
};

export type WelcomeScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;
export type ProfileSetupScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'ProfileSetup'
>;
export type GoalSetupScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'GoalSetup'>;

/**
 * AddEntryScreen is reached from both Today (tap a MealCard) and Journal (« + Ajouter » on a
 * MealSection), and is a modal presentation in both (interactions.md).
 *
 * KCAL-172 decision: declare the route in both stacks rather than reworking RootNavigator into
 * a root-level modal stack. Cost is this one duplicated route entry; benefit is no navigation
 * refactoring in the project's heaviest sprint.
 *
 * `date` is a `yyyy-MM-dd` local day key, not a Date: React Navigation params must stay
 * serializable (state persistence, deep links), and a diary entry belongs to a day anyway --
 * the repository normalizes to startOfDay on write (KCAL-169). A date-only string also avoids
 * the UTC-vs-local shift a full ISO timestamp would introduce.
 */
export type AddEntryRouteParams = { mealType: MealType; date: string };

export type TodayStackParamList = {
  Today: undefined;
  AddEntry: AddEntryRouteParams;
};

export type JournalStackParamList = {
  Journal: undefined;
  AddEntry: AddEntryRouteParams;
};

export type LibraryStackParamList = {
  Library: undefined;
  /**
   * `undefined` params = create mode, `{ foodId }` = edit mode (KCAL-118).
   *
   * KCAL-176: `initialName` prefills the name field when AddEntryScreen's "Créer cet aliment"
   * hands off a search term that matched nothing. Deliberately an optional field on the
   * existing params rather than a third mode -- the form stays in create mode, it just starts
   * with one field filled.
   */
  FoodForm: { foodId?: string; initialName?: string } | undefined;
  /**
   * `undefined` params = create mode, `{ recipeId }` = edit mode OR "opened after
   * duplicating" (KCAL-141 clones via `recipeRepository.create` then navigates here
   * in edit mode on the new recipe) -- same shape covers both.
   */
  RecipeForm: { recipeId: string } | undefined;
  RecipeDetail: { recipeId: string };
};

export type ProgressStackParamList = {
  Progress: undefined;
  Profile: undefined;
};

export type RootTabParamList = {
  TodayTab: NavigatorScreenParams<TodayStackParamList>;
  JournalTab: NavigatorScreenParams<JournalStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  ProgressTab: NavigatorScreenParams<ProgressStackParamList>;
};

export type TodayScreenProps = NativeStackScreenProps<TodayStackParamList, 'Today'>;
export type JournalScreenProps = NativeStackScreenProps<JournalStackParamList, 'Journal'>;
// One props type per stack, since the same screen is registered in both (see
// AddEntryRouteParams). The route params are identical, so AddEntryScreen itself is typed
// against the Journal one and works unchanged when pushed from the Today stack.
export type TodayAddEntryScreenProps = NativeStackScreenProps<TodayStackParamList, 'AddEntry'>;
export type JournalAddEntryScreenProps = NativeStackScreenProps<JournalStackParamList, 'AddEntry'>;
export type LibraryScreenProps = NativeStackScreenProps<LibraryStackParamList, 'Library'>;
export type FoodFormScreenProps = NativeStackScreenProps<LibraryStackParamList, 'FoodForm'>;
export type RecipeFormScreenProps = NativeStackScreenProps<LibraryStackParamList, 'RecipeForm'>;
export type RecipeDetailScreenProps = NativeStackScreenProps<LibraryStackParamList, 'RecipeDetail'>;
export type ProgressScreenProps = NativeStackScreenProps<ProgressStackParamList, 'Progress'>;
export type ProfileScreenProps = NativeStackScreenProps<ProgressStackParamList, 'Profile'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
