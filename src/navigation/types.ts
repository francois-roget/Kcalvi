import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TodayStackParamList = {
  Today: undefined;
};

export type JournalStackParamList = {
  Journal: undefined;
};

export type LibraryStackParamList = {
  Library: undefined;
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
export type ProgressScreenProps = NativeStackScreenProps<ProgressStackParamList, 'Progress'>;
export type ProfileScreenProps = NativeStackScreenProps<ProgressStackParamList, 'Profile'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
