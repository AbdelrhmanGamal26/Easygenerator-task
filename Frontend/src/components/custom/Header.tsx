import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/cn';
import type { RootState } from '@/store';
import Avatar from '@/components/custom/Avatar';

interface HeaderProps {
  className?: string;
}

/** Top bar shown on every page; signed-in users get an avatar linking to their profile. */
const Header = ({ className }: HeaderProps) => {
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <header
      className={cn(
        'flex items-center justify-between border-b border-indigo-100 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4',
        className,
      )}
    >
      <nav
        aria-label="Main"
        className="flex flex-1 items-center justify-between gap-3"
      >
        <Link to="/" className="text-base font-bold text-indigo-600 sm:text-lg">
          Auth App
        </Link>
        {user && (
          <Link
            to="/profile"
            className="min-w-0 flex items-center gap-1 sm:gap-2"
          >
            <span className="truncate text-xs font-semibold sm:text-sm">
              Hello, {user.name}
            </span>
            <Avatar name={user.name} />
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
