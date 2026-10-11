import { cn } from '@/lib/cn';

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

interface AvatarProps {
  name: string;
  className?: string;
}

/** Circular avatar showing the user's initials. */
const Avatar = ({ name, className }: AvatarProps) => {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white sm:size-10 sm:text-sm',
        className,
      )}
    >
      {getInitials(name) || '?'}
    </span>
  );
};

export default Avatar;
