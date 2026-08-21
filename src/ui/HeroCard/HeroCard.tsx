import type { PropsWithChildren } from 'react';

import Card from '@/ui/Card';

export type HeroCardProps = PropsWithChildren<{
  radius?: '3xl' | '4xl';
}>;

/** Dark card, radius 3xl/4xl — only one HeroCard per screen (components.md). */
function HeroCard({ radius = '4xl', children }: HeroCardProps) {
  return (
    <Card tone="dark" radius={radius} paddingVertical={18} paddingHorizontal={18}>
      {children}
    </Card>
  );
}

export default HeroCard;
