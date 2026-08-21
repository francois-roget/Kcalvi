import { Alert } from 'react-native';

import { profileRepository } from '@/data/repositories';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export function createResetPressHandler(t: TFunction): () => void {
  return () => {
    Alert.alert(t('profile.resetConfirmTitle'), t('profile.resetConfirmMessage'), [
      { text: t('profile.resetConfirmCancel'), style: 'cancel' },
      {
        text: t('profile.resetConfirmConfirm'),
        style: 'destructive',
        onPress: () => profileRepository.reset(),
      },
    ]);
  };
}
