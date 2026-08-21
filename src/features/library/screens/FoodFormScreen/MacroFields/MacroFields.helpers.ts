export type MacroFieldKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar';

export type MacroFieldSpec = {
  key: MacroFieldKey;
  labelKey: string;
  unitKey: 'foodForm.kcalUnit' | 'foodForm.gramUnit';
  requiredMessageKey?: string;
};

/** Field layout: three two-column rows, in the original screen's exact order. */
export const MACRO_FIELD_ROWS: MacroFieldSpec[][] = [
  [
    {
      key: 'calories',
      labelKey: 'foodForm.calories',
      unitKey: 'foodForm.kcalUnit',
      requiredMessageKey: 'foodForm.errors.caloriesRequired',
    },
    { key: 'protein', labelKey: 'foodForm.protein', unitKey: 'foodForm.gramUnit' },
  ],
  [
    { key: 'carbs', labelKey: 'foodForm.carbs', unitKey: 'foodForm.gramUnit' },
    { key: 'fat', labelKey: 'foodForm.fat', unitKey: 'foodForm.gramUnit' },
  ],
  [
    { key: 'fiber', labelKey: 'foodForm.fiber', unitKey: 'foodForm.gramUnit' },
    { key: 'sugar', labelKey: 'foodForm.sugar', unitKey: 'foodForm.gramUnit' },
  ],
];
