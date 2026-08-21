import type { Food, FoodPortion } from '@/domain/types';
import BottomSheet from '@/ui/BottomSheet';

import type { PickerStep, QuantityMode, QuickPortionPill } from '../RecipeFormScreen.helpers';
import { QuantityStep } from './QuantityStep';
import { SearchStep } from './SearchStep';

export type IngredientPickerSheetProps = {
  visible: boolean;
  step: PickerStep;
  onClose: () => void;
  ingredientQuery: string;
  onQueryChange: (value: string) => void;
  foodResults: Food[];
  onSelectFood: (food: Food) => void;
  selectedFood: Food | null;
  quantityMode: QuantityMode;
  onQuantityModeChange: (mode: QuantityMode) => void;
  quantityText: string;
  onQuantityTextChange: (value: string) => void;
  quantityError?: string;
  activePortion?: FoodPortion;
  onSelectPill: (pill: QuickPortionPill) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * KCAL-133 — the "+ Ajouter un ingrédient" picker: a two-step BottomSheet (search a food,
 * then enter a quantity for it). Purely presentational -- all state/handlers live in
 * RecipeFormScreen.helpers.ts's useRecipeForm().
 */
export function IngredientPickerSheet({
  visible,
  step,
  onClose,
  ingredientQuery,
  onQueryChange,
  foodResults,
  onSelectFood,
  selectedFood,
  quantityMode,
  onQuantityModeChange,
  quantityText,
  onQuantityTextChange,
  quantityError,
  activePortion,
  onSelectPill,
  onConfirm,
  onCancel,
}: IngredientPickerSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} minHeightRatio={0.7}>
      {step === 'search' ? (
        <SearchStep
          query={ingredientQuery}
          onQueryChange={onQueryChange}
          foodResults={foodResults}
          onSelectFood={onSelectFood}
        />
      ) : selectedFood ? (
        <QuantityStep
          food={selectedFood}
          quantityMode={quantityMode}
          onQuantityModeChange={onQuantityModeChange}
          quantityText={quantityText}
          onQuantityTextChange={onQuantityTextChange}
          quantityError={quantityError}
          activePortion={activePortion}
          onSelectPill={onSelectPill}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ) : null}
    </BottomSheet>
  );
}

export default IngredientPickerSheet;
