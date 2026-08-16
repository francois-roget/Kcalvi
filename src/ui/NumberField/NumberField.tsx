import TextField, { type TextFieldProps } from '@/ui/TextField';

export type NumberFieldProps = Omit<TextFieldProps, 'numeric'>;

export function NumberField(props: NumberFieldProps) {
  return <TextField {...props} numeric />;
}

export default NumberField;
