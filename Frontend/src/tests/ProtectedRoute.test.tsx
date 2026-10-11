import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { store } from '@/store';
import { login, logout } from '@/store/userSlice';
import { getCurrentUser } from '@/services/authServices';
import ProtectedRoutesLayout from '@/layouts/ProtectedRoutesLayout';

vi.mock('@/services/authServices');

const renderAt = (path: string) =>
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<ProtectedRoutesLayout />}>
              <Route path="/app" element={<p>private</p>} />
            </Route>
            <Route path="/login" element={<p>login page</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

afterEach(() => {
  cleanup();
  store.dispatch(logout());
});

const user = { email: 'jane@example.com', name: 'Jane' };

describe('ProtectedRoutesLayout', () => {
  it('redirects signed-out users to /login', () => {
    renderAt('/app');
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('renders the page at once for signed-in users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    store.dispatch(login({ user }));
    renderAt('/app');
    expect(screen.getByText('private')).toBeTruthy();
  });

  it('redirects to /login when the background check logs the user out', async () => {
    vi.mocked(getCurrentUser).mockImplementation(async () => {
      store.dispatch(logout());
      throw new Error('401');
    });
    store.dispatch(login({ user }));
    renderAt('/app');
    expect(await screen.findByText('login page')).toBeTruthy();
  });
});
