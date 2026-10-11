import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';

const NotFound = lazy(() => import('@/pages/NotFound'));
const Login = lazy(() => import('@/pages/authPages/Login'));
const Signup = lazy(() => import('@/pages/authPages/Signup'));
const Profile = lazy(() => import('@/pages/Profile'));
const Application = lazy(() => import('@/pages/Application'));
const ProtectedRoutesLayout = lazy(
  () => import('@/layouts/ProtectedRoutesLayout'),
);

/**
 * Declares the app's full route tree: public auth pages (under `AuthLayout`)
 * and the protected application page behind `ProtectedRoutesLayout`. All page
 * components are lazy-loaded.
 */
const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/app" replace />} />
        {/* this is a layout for auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* this is a layout for app main routes */}
        <Route element={<ProtectedRoutesLayout />}>
          <Route path="/app" element={<Application />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
