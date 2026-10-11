import { describe, expect, it } from 'vitest';
import reducer, { login, logout } from '@/store/userSlice';

const session = {
  user: { email: 'jane@example.com', name: 'Jane' },
};

describe('userSlice', () => {
  it('stores the session on login', () => {
    const state = reducer(undefined, login(session));
    expect(state).toEqual({ ...session, isLoggedIn: true });
  });

  it('clears the session on logout', () => {
    const state = reducer(reducer(undefined, login(session)), logout());
    expect(state).toEqual({ user: null, isLoggedIn: false });
  });
});
