import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageCenterProps {
  children: ReactNode;
  className?: string;
}

/** Fills the remaining page height and centers its content. */
const PageCenter = ({ children, className }: PageCenterProps) => {
  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-center p-3 sm:p-4',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default PageCenter;
