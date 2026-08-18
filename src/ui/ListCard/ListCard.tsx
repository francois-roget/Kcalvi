import {
  Children,
  cloneElement,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Card from '@/ui/Card';
import type { ListRowProps } from '@/ui/ListRow';
import type { Theme } from '@/ui/theme';

export function ListCard({ children }: PropsWithChildren) {
  const theme = useTheme() as Theme;
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<ListRowProps>[];

  return (
    <Card tone="light" radius="2xl" paddingVertical={0} paddingHorizontal={0}>
      {/* Wrapper séparé de la Card (qui porte l'ombre) : clippe les fonds de ligne
          (ex: surbrillance d'une ligne sélectionnée) aux coins arrondis sans couper l'ombre. */}
      <View style={{ borderRadius: theme.radius['2xl'], overflow: 'hidden' }}>
        {items.map((item, index) =>
          cloneElement(item, { key: index, isLast: index === items.length - 1 }),
        )}
      </View>
    </Card>
  );
}

export default ListCard;
