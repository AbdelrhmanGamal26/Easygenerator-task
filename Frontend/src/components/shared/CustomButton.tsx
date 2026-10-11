import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

/** Primary button that disables itself and swaps its label while loading. */
const CustomButton = ({
  children,
  disabled,
  className,
  isLoading,
  loadingText,
  ...rest
}: CustomButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        'mt-3 w-full cursor-pointer rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-indigo-600 sm:py-3 sm:text-base',
        className,
      )}
      {...rest}
    >
      {isLoading ? (loadingText ?? children) : children}
    </button>
  );
};

export default CustomButton;
