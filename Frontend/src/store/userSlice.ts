import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadPersistedUser } from '@/lib/persistedUser';
import type { AuthResponse, UserState } from '@/@types/authTypes';

const loadInitialState = (): UserState => {
  const user = loadPersistedUser();

  return { user, isLoggedIn: !!user };
};

const userSlice = createSlice({
  name: 'user',
  initialState: loadInitialState,
  reducers: {
    login: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
