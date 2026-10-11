import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Application from '@/pages/Application';
import ProtectedRoutesLayout from '@/layouts/ProtectedRoutesLayout';
import { queryClient } from '@/lib/queryClient';
import {
  getCurrentUser,
  logoutAllSessions,
  logoutUser,
} from '@/services/authServices';
import { store } from '@/store';
import { login, logout } from '@/store/userSlice';

vi.mock('@/services/authServices');

const user = { email: 'jane@example.com', name: 'Jane' };

const renderApp = () =>
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app']}>
          <Routes>
            <Route element={<ProtectedRoutesLayout />}>
              <Route path="/app" element={<Application />} />
            </Route>
            <Route path="/login" element={<p>login page</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  store.dispatch(logout());
});

describe('Application logout', () => {
  it('signs out, clears the cache and returns to /login', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.mocked(logoutUser).mockResolvedValue();
    store.dispatch(login({ user }));
    queryClient.setQueryData(['users', 'me'], user);
    renderApp();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /^log out$/i }));

    expect(await screen.findByText('login page')).toBeTruthy();
    expect(store.getState().user.isLoggedIn).toBe(false);
    expect(queryClient.getQueryData(['users', 'me'])).toBeUndefined();
  });

  it('ends every session from the all-devices button', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.mocked(logoutAllSessions).mockResolvedValue();
    store.dispatch(login({ user }));
    renderApp();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /all devices/i }));

    expect(await screen.findByText('login page')).toBeTruthy();
    expect(logoutAllSessions).toHaveBeenCalledTimes(1);
    expect(logoutUser).not.toHaveBeenCalled();
    expect(store.getState().user.isLoggedIn).toBe(false);
  });

  it('still signs out locally when the request fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    vi.mocked(logoutUser).mockRejectedValue(new Error('offline'));
    store.dispatch(login({ user }));
    renderApp();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /^log out$/i }));

    await waitFor(() => expect(store.getState().user.isLoggedIn).toBe(false));
    expect(await screen.findByText('login page')).toBeTruthy();
  });
});
