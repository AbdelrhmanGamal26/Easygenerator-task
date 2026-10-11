import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/** Reads the current login state from the Redux user slice. */
export const useIsAuthenticated = () =>
  useSelector((state: RootState) => state.user.isLoggedIn);
