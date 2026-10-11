import axios, { type InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { logout } from '@/store/userSlice';
import { queryClient } from '@/lib/queryClient';
import { BACKEND_RESOURCES, RESPONSE_STATUSES } from '@/constants/general';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const REFRESH_URL = `${BACKEND_RESOURCES.AUTH}/refresh`;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
  // Sends/receives the httpOnly access and refresh token cookies set by the backend.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Shared so concurrent 401s trigger one refresh; the backend rotates (and so invalidates) the token on each call.
let refreshing: Promise<unknown> | null = null;

const refreshSession = () => {
  refreshing ??= axiosInstance
    .post(REFRESH_URL)
    .finally(() => (refreshing = null));

  return refreshing;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const isUnauthorized =
      error.response?.status === RESPONSE_STATUSES.UNAUTHORIZED;
    const canRefresh =
      isUnauthorized &&
      config &&
      !config._retried &&
      config.url !== REFRESH_URL &&
      store.getState().user.isLoggedIn;

    if (canRefresh) {
      config._retried = true;

      try {
        await refreshSession();

        return await axiosInstance(config);
      } catch (retryError) {
        // Falls through to end the session when refreshing or the retry fails with 401.
        error = retryError;
      }
    }

    if (
      axios.isAxiosError(error) &&
      error.response?.status === RESPONSE_STATUSES.UNAUTHORIZED &&
      store.getState().user.isLoggedIn
    ) {
      store.dispatch(logout());
      queryClient.clear();
    }

    return Promise.reject(error);
  },
);

/** Shared axios instance with the backend base URL; sends session cookies, refreshes once on a 401 and logs out if that fails. */
export default axiosInstance;
