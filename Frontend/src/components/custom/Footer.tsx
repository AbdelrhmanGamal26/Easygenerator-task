import { cn } from '@/lib/cn';

const CURRENT_YEAR = new Date().getFullYear();

interface FooterProps {
  className?: string;
}

/** Bottom bar shown on every page. */
const Footer = ({ className }: FooterProps) => {
  return (
    <footer
      className={cn(
        'border-t border-indigo-100 bg-white px-4 py-4 text-center text-xs text-gray-500 sm:px-6 sm:text-sm',
        className,
      )}
    >
      &copy; {CURRENT_YEAR} Auth App. All rights reserved.
    </footer>
  );
};

export default Footer;
