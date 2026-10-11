import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '@/services/authServices';
import type { RootState } from '@/store';

const CURRENT_USER_QUERY_KEY = ['users', 'me'] as const;

/** Fetches `GET /users/me` while signed in, showing the stored profile until it arrives; retries are off so a 401 logs out immediately via the axios interceptor. */
export const useCurrentUserQuery = () => {
  const storedUser = useSelector((state: RootState) => state.user.user);

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!storedUser,
    placeholderData: storedUser ?? undefined,
  });
};
