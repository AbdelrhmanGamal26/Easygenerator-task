import { Navigate, Outlet } from 'react-router';
import { useIsAuthenticated } from '@/hooks/useIsAuthenticated';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';

/** Route guard for the authenticated area;
 * renders at once and revalidates the session in the background,
 * redirecting to `/login` if it turns out to be expired.
 * */
const ProtectedRoutesLayout = () => {
  const isLoggedIn = useIsAuthenticated();

  // Background session check; logs out and clears the cache if the cookie has expired.
  useCurrentUserQuery();

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoutesLayout;
