import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ActivityLevel, Sex } from '@/domain/types';

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

export type TodayStackParamList = {
  Today: undefined;
};

export type JournalStackParamList = {
  Journal: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
  /** `undefined` params = create mode, `{ foodId }` = edit mode (KCAL-118). */
  FoodForm: { foodId: string } | undefined;
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
