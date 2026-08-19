import { parseLocaleNumber, unitLabel } from './format';

describe('parseLocaleNumber', () => {
  it('parses a comma decimal separator (fr-BE decimal-pad keyboard)', () => {
    expect(parseLocaleNumber('82,5')).toBe(82.5);
  });

  it('parses a dot decimal separator', () => {
    expect(parseLocaleNumber('82.5')).toBe(82.5);
  });

  it('parses integers', () => {
    expect(parseLocaleNumber('178')).toBe(178);
  });

  it('trims surrounding whitespace', () => {
    expect(parseLocaleNumber(' 82,5 ')).toBe(82.5);
  });

  it('returns NaN for non-numeric input', () => {
    expect(Number.isNaN(parseLocaleNumber('abc'))).toBe(true);
  });

  it('returns 0 for empty input (caught downstream by range validation)', () => {
    expect(parseLocaleNumber('')).toBe(0);
  });
});

describe('unitLabel', () => {
  // A minimal stand-in for i18next's `t`, exercising the same `recipeForm.units.*` +
  // `defaultValue` contract the real translation function honors.
  const KNOWN_UNITS: Record<string, string> = { g: 'g', ml: 'ml', unit: 'unité' };
  function fakeT(key: string, options?: Record<string, unknown>): string {
    const code = key.replace('recipeForm.units.', '');
    return KNOWN_UNITS[code] ?? (options?.defaultValue as string) ?? key;
  }

  it('translates the "unit" code to its French label instead of the raw code (KCAL-158)', () => {
    expect(unitLabel(fakeT, 'unit')).toBe('unité');
  });

  it('translates g and ml unchanged', () => {
    expect(unitLabel(fakeT, 'g')).toBe('g');
    expect(unitLabel(fakeT, 'ml')).toBe('ml');
  });

  it('falls back to the raw code for an unrecognized unit', () => {
    expect(unitLabel(fakeT, 'weird')).toBe('weird');
  });
});
