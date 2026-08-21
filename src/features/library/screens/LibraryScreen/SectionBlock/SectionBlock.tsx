import type { PropsWithChildren, ReactNode } from 'react';

import Text from '@/ui/Text';

import { Container, HeaderRow } from './SectionBlock.styles';

export type SectionBlockProps = PropsWithChildren<{
  testID: string;
  title: string;
  /** Recipes section only (KCAL-142): the "+" create button next to the title. */
  headerAction?: ReactNode;
}>;

/**
 * KCAL-157 — shared shape for the Foods/Recipes list sections: an overline title (with an
 * optional trailing action) followed by the section content (list or "Aucun résultat"). The
 * whole block is gated by the caller on the active quick filter, not just its content, so it's
 * absent from the render tree entirely when the section shouldn't show at all.
 */
export function SectionBlock({ testID, title, headerAction, children }: SectionBlockProps) {
  return (
    <Container testID={testID}>
      {headerAction ? (
        <HeaderRow>
          <Text variant="overline" color="text.tertiary">
            {title}
          </Text>
          {headerAction}
        </HeaderRow>
      ) : (
        <Text variant="overline" color="text.tertiary">
          {title}
        </Text>
      )}
      {children}
    </Container>
  );
}

export default SectionBlock;
