import { Link } from 'react-router';
import Card from '@/components/shared/Card';
import Avatar from '@/components/custom/Avatar';
import { handleErrorMessage } from '@/lib/utils';
import DetailItem from '@/components/shared/DetailItem';
import PageCenter from '@/components/shared/PageCenter';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';

/** Profile page: loads the current user from `GET /users/me` and shows their avatar and details. */
const Profile = () => {
  const { data: user, error: queryError } = useCurrentUserQuery();
  const error = queryError
    ? handleErrorMessage(queryError, 'Failed to load profile')
    : null;

  return (
    <PageCenter>
      <Card>
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">Profile</h1>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!user && !error && (
          <p className="text-sm" role="status" aria-live="polite">
            Loading...
          </p>
        )}
        {user && (
          <div className="flex flex-col items-center gap-4">
            <Avatar
              name={user.name}
              className="size-20 text-2xl sm:size-24 sm:text-3xl"
            />
            <dl className="w-full space-y-3 text-sm">
              <DetailItem label="Name">{user.name}</DetailItem>
              <DetailItem label="Email">{user.email}</DetailItem>
            </dl>
          </div>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/app" className="text-indigo-600">
            Back to the home page
          </Link>
        </p>
      </Card>
    </PageCenter>
  );
};

export default Profile;
