import { toNumberOrUndefined } from '../RecipeFormScreen.helpers';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/** react-hook-form `validate` for the name field: required, ignoring surrounding whitespace. */
export function validateName(value: string, t: TFunction): true | string {
  return value.trim().length > 0 || t('recipeForm.errors.nameRequired');
}

/** react-hook-form `validate` for the servings field: must parse to a strictly positive number. */
export function validateServings(value: string, t: TFunction): true | string {
  const parsed = toNumberOrUndefined(value);
  if (parsed === undefined || Number.isNaN(parsed) || parsed <= 0) {
    return t('recipeForm.errors.servingsInvalid');
  }
  return true;
}
