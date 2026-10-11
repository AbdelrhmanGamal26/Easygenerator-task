import type { ComponentProps } from 'react';
import {
  useController,
  type Path,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import { cn } from '@/lib/cn';

type FormInputFieldProps<T extends FieldValues> = Omit<
  ComponentProps<'input'>,
  'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'ref'
> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

/** Label + input bound to a react-hook-form field; `className` styles the input, the error comes from the form's (zod) resolver. */
const FormInputField = <T extends FieldValues>({
  id,
  name,
  label,
  control,
  className,
  ...rest
}: FormInputFieldProps<T>) => {
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? name;
  const error = fieldState.error?.message;

  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="mb-1 text-sm font-semibold">
        {label}
      </label>
      <input
        {...rest}
        {...field}
        id={inputId}
        value={field.value ?? ''}
        className={cn(
          'rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-transparent focus:outline-2 focus:outline-indigo-500 aria-invalid:border-red-600 sm:px-3 sm:py-2 sm:text-base',
          className,
        )}
        aria-invalid={!!error}
        aria-required="true"
        aria-describedby={`${inputId}-error`}
      />
      {/* Always rendered so showing an error never shifts the layout. */}
      <p
        id={`${inputId}-error`}
        className="h-5 text-xs leading-5 text-red-600"
        aria-live="polite"
      >
        {error}
      </p>
    </div>
  );
};

export default FormInputField;
