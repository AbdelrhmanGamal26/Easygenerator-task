import { configureStore } from '@reduxjs/toolkit';
import { savePersistedUser } from '@/lib/persistedUser';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: { user: userReducer },
});

// Persist the signed-in user's profile (not the token, which lives in an httpOnly cookie) across reloads.
let persistedUser = store.getState().user.user;

store.subscribe(() => {
  const { user } = store.getState().user;

  if (user !== persistedUser) {
    persistedUser = user;
    savePersistedUser(user);
  }
});

export type RootState = ReturnType<typeof store.getState>;
