import { Outlet } from 'react-router';
import PageCenter from '@/components/shared/PageCenter';
import PublicRoute from '@/components/custom/PublicRoute';

/** Layout for unauthenticated auth pages (login, sign up); centers the routed page in the viewport. */
const AuthLayout = () => {
  return (
    <PublicRoute>
      <PageCenter>
        <Outlet />
      </PageCenter>
    </PublicRoute>
  );
};

export default AuthLayout;
