import { colors, layout, radius, shadows, spacing, typography } from './tokens';

// Un seul thème pour le MVP (dark mode non implémenté — TECHNICAL_SPECS §9.1, §20).
// La structure des tokens le permet déjà (ink.* deviendraient les surfaces, sand.* les textes).
export const theme = { colors, spacing, radius, typography, shadows, layout } as const;

export type Theme = typeof theme;

export * from './tokens';
