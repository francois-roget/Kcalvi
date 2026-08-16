import {
  Children,
  cloneElement,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import Card from '@/ui/Card';
import type { ListRowProps } from '@/ui/ListRow';

export function ListCard({ children }: PropsWithChildren) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<ListRowProps>[];

  return (
    <Card tone="light" paddingVertical={0} paddingHorizontal={0}>
      {items.map((item, index) =>
        cloneElement(item, { key: index, isLast: index === items.length - 1 }),
      )}
    </Card>
  );
}

export default ListCard;
