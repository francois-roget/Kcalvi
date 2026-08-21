import { useTranslation } from 'react-i18next';

import Button from '@/ui/Button';
import Card from '@/ui/Card';
import Chip from '@/ui/Chip';
import NumberField from '@/ui/NumberField';
import TextField from '@/ui/TextField';

import { REFERENCE_UNITS, type ReferenceUnit } from '../../FoodFormScreen.helpers';
import { ChipRow, FieldGroup, MarginTopRow } from './PortionEditor.styles';

export type PortionEditorProps = {
  labelText: string;
  onLabelChange: (value: string) => void;
  quantityText: string;
  onQuantityChange: (value: string) => void;
  unit: ReferenceUnit;
  onUnitChange: (unit: ReferenceUnit) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Inline "Portions usuelles" create/edit editor: label + quantity + unit (KCAL-163e). */
export function PortionEditor({
  labelText,
  onLabelChange,
  quantityText,
  onQuantityChange,
  unit,
  onUnitChange,
  onCancel,
  onConfirm,
}: PortionEditorProps) {
  const { t } = useTranslation();

  return (
    <Card tone="muted">
      <TextField
        testID="foodForm.quickPortions.label"
        label={t('foodForm.quickPortions.labelField')}
        placeholder={t('foodForm.quickPortions.labelPlaceholder')}
        value={labelText}
        onChangeText={onLabelChange}
      />
      <MarginTopRow>
        <FieldGroup>
          <NumberField
            testID="foodForm.quickPortions.quantity"
            label={t('foodForm.quickPortions.quantityLabel')}
            value={quantityText}
            onChangeText={onQuantityChange}
          />
        </FieldGroup>
        <FieldGroup>
          <ChipRow>
            {REFERENCE_UNITS.map((candidate) => (
              <Chip
                key={candidate}
                testID={`foodForm.quickPortions.unit.${candidate}`}
                label={t(`foodForm.units.${candidate}`)}
                selected={unit === candidate}
                onPress={() => onUnitChange(candidate)}
              />
            ))}
          </ChipRow>
        </FieldGroup>
      </MarginTopRow>
      <MarginTopRow>
        <Button
          testID="foodForm.quickPortions.cancel"
          label={t('foodForm.quickPortions.cancel')}
          variant="secondary"
          size="md"
          onPress={onCancel}
        />
        <Button
          testID="foodForm.quickPortions.confirm"
          label={t('foodForm.quickPortions.confirm')}
          variant="primary"
          size="md"
          onPress={onConfirm}
        />
      </MarginTopRow>
    </Card>
  );
}

export default PortionEditor;
