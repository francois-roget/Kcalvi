import type { ActivityLevel } from '@/domain/types';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import Text from '@/ui/Text';

import { ACTIVITY_LEVELS, ACTIVITY_STARS, type TFunction } from '../ProfileSetupScreen.helpers';

type ActivityLevelSectionProps = {
  t: TFunction;
  activityLevel: ActivityLevel;
  onActivityLevelChange: (level: ActivityLevel) => void;
};

export function ActivityLevelSection({
  t,
  activityLevel,
  onActivityLevelChange,
}: ActivityLevelSectionProps) {
  return (
    <>
      <Text variant="title">{t('onboarding.profileSetup.activityLevel')}</Text>
      <ListCard>
        {ACTIVITY_LEVELS.map((level) => (
          <ListRow
            key={level}
            label={t(`onboarding.profileSetup.activityLevels.${level}`)}
            stars={ACTIVITY_STARS[level]}
            selected={activityLevel === level}
            onPress={() => onActivityLevelChange(level)}
          />
        ))}
      </ListCard>
    </>
  );
}

export default ActivityLevelSection;
