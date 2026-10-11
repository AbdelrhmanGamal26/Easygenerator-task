import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'react-toastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Login from '@/pages/authPages/Login';
import AuthLayout from '@/layouts/AuthLayout';
import { loginUser } from '@/services/authServices';
import { store } from '@/store';
import { logout } from '@/store/userSlice';

vi.mock('@/services/authServices');
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const renderLogin = () =>
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route path="/app" element={<p>app page</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

const submit = async (password = 'Passw0rd!') => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /login/i }));
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  store.dispatch(logout());
});

describe('Login', () => {
  it('shows validation errors and does not call the API', async () => {
    renderLogin();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('starts a session and lands on /app', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      user: { email: 'jane@example.com', name: 'Jane' },
    });
    renderLogin();
    await submit();

    expect(await screen.findByText('app page')).toBeTruthy();
    expect(store.getState().user.isLoggedIn).toBe(true);
  });

  it('shows a toast and stays signed out when the request fails', async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error('boom'));
    renderLogin();
    await submit();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Incorrect email or password'),
    );
    expect(store.getState().user.isLoggedIn).toBe(false);
  });
});
