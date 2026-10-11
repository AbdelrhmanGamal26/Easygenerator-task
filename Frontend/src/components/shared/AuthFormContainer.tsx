import { useId, type FormEvent, type ReactNode } from 'react';
import Card from '@/components/shared/Card';

interface AuthFormContainerProps {
  title: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/** Card wrapper shared by the login and sign-up forms: title, form body and footer link. */
const AuthFormContainer = ({
  title,
  footer,
  onSubmit,
  children,
  className,
}: AuthFormContainerProps) => {
  const titleId = useId();
  return (
    <Card className={className}>
      <h1
        id={titleId}
        className="mb-6 text-xl font-bold wrap-break-word sm:text-2xl"
      >
        {title}
      </h1>
      <form onSubmit={onSubmit} aria-labelledby={titleId} noValidate>
        {children}
      </form>
      {footer && (
        <p className="mt-4 text-center text-sm [&_a]:text-indigo-600">
          {footer}
        </p>
      )}
    </Card>
  );
};

export default AuthFormContainer;
