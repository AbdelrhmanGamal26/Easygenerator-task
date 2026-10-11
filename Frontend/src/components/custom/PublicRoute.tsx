import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';

interface PublicRouteProps {
  children: ReactNode;
}

/** Route guard that redirects already-authenticated users away from public-only pages (e.g. login/sign-up). */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const isLoggedIn = useIsAuthenticated();

  return isLoggedIn ? <Navigate to="/app" replace /> : children;
};

export default PublicRoute;
