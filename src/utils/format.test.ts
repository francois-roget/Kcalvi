import { parseLocaleNumber } from './format';

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
