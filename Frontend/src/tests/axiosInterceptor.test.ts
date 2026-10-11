import { AxiosError, type AxiosAdapter } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '@/store';
import axiosInstance from '@/lib/axios';
import { login, logout } from '@/store/userSlice';

const user = { id: '1', name: 'Jane Doe', email: 'jane@example.com' };

/** Installs an adapter that answers each request with `statusFor(url, callIndex)`. */
const mockBackend = (statusFor: (url: string, index: number) => number) => {
  const urls: string[] = [];
  const adapter: AxiosAdapter = async (config) => {
    const status = statusFor(config.url ?? '', urls.length);
    const response = {
      data: {},
      status,
      statusText: '',
      headers: {},
      config,
    };
    urls.push(config.url ?? '');

    if (status >= 400) {
      throw new AxiosError('failed', undefined, config, null, response);
    }

    return response;
  };
  axiosInstance.defaults.adapter = adapter;

  return urls;
};

describe('axios 401 handling', () => {
  beforeEach(() => {
    store.dispatch(logout());
  });

  it('refreshes the session once and retries the request', async () => {
    store.dispatch(login({ user }));
    const urls = mockBackend((url, index) =>
      url === '/users/me' && index === 0 ? 401 : 200,
    );

    await axiosInstance.get('/users/me');

    expect(urls).toEqual(['/users/me', '/auth/refresh', '/users/me']);
    expect(store.getState().user.isLoggedIn).toBe(true);
  });

  it('logs the user out when the refresh fails', async () => {
    store.dispatch(login({ user }));
    const urls = mockBackend(() => 401);

    await expect(axiosInstance.get('/users/me')).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(urls).toEqual(['/users/me', '/auth/refresh']);
    expect(store.getState().user.isLoggedIn).toBe(false);
  });

  it('does not try to refresh when signed out', async () => {
    const urls = mockBackend(() => 401);

    await expect(axiosInstance.post('/auth/signin')).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(urls).toEqual(['/auth/signin']);
  });
});
