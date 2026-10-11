import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { toast } from 'react-toastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Signup from '@/pages/authPages/Signup';
import { signupUser } from '@/services/authServices';
import { store } from '@/store';

vi.mock('@/services/authServices');
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const renderSignup = () =>
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<p>login page</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

const fill = async (password: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Name'), 'Jane');
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /sign up/i }));
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Signup', () => {
  it('shows validation errors and does not call the API', async () => {
    renderSignup();
    await fill('short');

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeTruthy();
    expect(signupUser).not.toHaveBeenCalled();
  });

  it('signs up and navigates to the login page without starting a session', async () => {
    vi.mocked(signupUser).mockResolvedValue({
      user: { email: 'jane@example.com', name: 'Jane' },
    });
    renderSignup();
    await fill('Passw0rd!');

    expect(await screen.findByText('login page')).toBeTruthy();
    expect(store.getState().user.isLoggedIn).toBe(false);
  });

  it('shows a toast when the request fails', async () => {
    vi.mocked(signupUser).mockRejectedValue(new Error('boom'));
    renderSignup();
    await fill('Passw0rd!');

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Signup failed'),
    );
  });
});
