import { useDispatch } from 'react-redux';
import { logout } from '@/store/userSlice';
import Card from '@/components/shared/Card';
import { queryClient } from '@/lib/queryClient';
import { logoutAllSessions, logoutUser } from '@/services/authServices';
import PageCenter from '@/components/shared/PageCenter';
import CustomButton from '@/components/shared/CustomButton';

/** Authenticated landing page with a welcome message and a logout button. */
const Application = () => {
  const dispatch = useDispatch();

  const handleLogout = async (endAllSessions = false) => {
    try {
      await (endAllSessions ? logoutAllSessions() : logoutUser());
    } catch {
      // Clear local state even if the request fails; the cookie expires on its own.
    }
    // ProtectedRoutesLayout redirects to /login once the user is logged out.
    dispatch(logout());
    queryClient.clear();
  };

  return (
    <PageCenter>
      <Card>
        <h1 className="mb-6 text-center text-xl font-bold sm:text-2xl">
          Welcome to the application.
        </h1>
        <CustomButton type="button" onClick={() => handleLogout()}>
          Log out
        </CustomButton>
        <CustomButton
          type="button"
          onClick={() => handleLogout(true)}
          className="bg-gray-600 hover:bg-gray-700 disabled:hover:bg-gray-600"
        >
          Log out of all devices
        </CustomButton>
      </Card>
    </PageCenter>
  );
};

export default Application;
