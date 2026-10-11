import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** White rounded surface used by every centered page. */
const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        'w-full max-w-sm rounded-xl bg-white p-5 shadow-lg shadow-indigo-600/15 sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;
