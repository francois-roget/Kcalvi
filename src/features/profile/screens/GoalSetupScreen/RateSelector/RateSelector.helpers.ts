export const RATES = [0.25, 0.5, 0.75] as const;

export function formatRate(value: number): string {
  return value.toString().replace('.', ',');
}
