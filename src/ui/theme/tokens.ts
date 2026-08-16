// Design tokens validés — voir specs/design_handoff_kcalvi/theme.ts (source du handoff design).
export const colors = {
  ink: { 900: '#0F2231', 800: '#17303D', 700: '#264A5C' },
  azure: { 600: '#1C86C4', 400: '#4FB0E8', 300: '#8FC3E0', 100: '#DCEAF2', 50: '#F1F7FB' },
  terracotta: { 600: '#C4643C', 300: '#E8A88A', 100: '#F6E5DC' },
  olive: { 500: '#7B8C6A' },
  sand: { 100: '#FDFBF7', 200: '#F4EFE7', 300: '#F1EDE5', 400: '#EDE8DF' },
  border: {
    default: '#E9E3D8',
    subtle: '#F1EDE5',
    dashed: '#DCD5C8',
    onDark: '#264A5C',
    info: '#D3E5F0',
  },
  text: {
    primary: '#17303D',
    secondary: '#6E7C86',
    tertiary: '#8A9AA5',
    quaternary: '#A6B2BB',
    disabled: '#C0C9CF',
    accent: '#1C86C4',
  },
  onDark: { primary: '#FFFFFF', accent: '#4FB0E8', muted: '#8FB4C7', subtle: '#6E8798' },
  macro: { protein: '#1C86C4', carbs: '#C4643C', fat: '#7B8C6A' },
  feedback: { over: '#C4643C', inTarget: '#1C86C4', burned: '#E8A88A' },
} as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 14, 5: 16, 6: 18, 7: 22, 8: 26 } as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontFamily: 'Manrope_800ExtraBold', fontSize: 40, letterSpacing: -1.4 },
  stat: { fontFamily: 'Manrope_800ExtraBold', fontSize: 32, letterSpacing: -1 },
  h1: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, letterSpacing: -0.4 },
  h2: { fontFamily: 'Manrope_800ExtraBold', fontSize: 18 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16 },
  body: { fontFamily: 'Manrope_600SemiBold', fontSize: 14 },
  bodySm: { fontFamily: 'Manrope_600SemiBold', fontSize: 13.5 },
  caption: { fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
  overline: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  micro: { fontFamily: 'Manrope_600SemiBold', fontSize: 10.5 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#17303D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  raised: {
    shadowColor: '#17303D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#17303D',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const layout = {
  screenPaddingH: 22,
  blockGap: 12,
  tabBar: { paddingTop: 11, paddingBottom: 24, borderColor: colors.sand[400] },
  minTouchTarget: 44,
} as const;
