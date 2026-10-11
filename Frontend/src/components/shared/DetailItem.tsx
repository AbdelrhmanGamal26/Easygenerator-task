import type { ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Label/value pair; must be rendered inside a `<dl>`. */
const DetailItem = ({ label, children, className }: DetailItemProps) => {
  return (
    <div className={className}>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="wrap-break-word">{children}</dd>
    </div>
  );
};

export default DetailItem;
