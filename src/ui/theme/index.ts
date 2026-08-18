import { colors, layout, radius, shadows, spacing, typography } from './tokens';

// Single theme for the MVP (dark mode not implemented — TECHNICAL_SPECS §9.1, §20).
// The token structure already supports it (ink.* would become surfaces, sand.* would become text).
export const theme = { colors, spacing, radius, typography, shadows, layout } as const;

export type Theme = typeof theme;

export * from './tokens';
