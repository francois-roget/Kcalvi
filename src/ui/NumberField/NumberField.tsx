import TextField, { type TextFieldProps } from '@/ui/TextField';

export type NumberFieldProps = Omit<TextFieldProps, 'numeric'>;

function NumberField(props: NumberFieldProps) {
  return <TextField {...props} numeric />;
}

export default NumberField;
