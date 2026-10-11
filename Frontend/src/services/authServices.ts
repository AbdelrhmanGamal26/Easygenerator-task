import type {
  User,
  AuthResponse,
  LoginPayload,
  SignupPayload,
} from '@/@types/authTypes';
import axiosInstance from '@/lib/axios';
import { BACKEND_RESOURCES } from '@/constants/general';

/** Registers an account via `POST /auth/signup`. */
export const signupUser = async (payload: SignupPayload) => {
  const res = await axiosInstance.post<AuthResponse>(
    `${BACKEND_RESOURCES.AUTH}/signup`,
    payload,
  );

  return res.data;
};

/** Authenticates via `POST /auth/signin`; the backend sets the session cookie. */
export const loginUser = async (payload: LoginPayload) => {
  const res = await axiosInstance.post<AuthResponse>(
    `${BACKEND_RESOURCES.AUTH}/signin`,
    payload,
  );

  return res.data;
};

/** Clears the session cookie via `POST /auth/signout`. */
export const logoutUser = async () => {
  await axiosInstance.post(`${BACKEND_RESOURCES.AUTH}/signout`);
};

/** Ends every session of the user via `POST /auth/signout-all`. */
export const logoutAllSessions = async () => {
  await axiosInstance.post(`${BACKEND_RESOURCES.AUTH}/signout-all`);
};

/** Fetches the current user via `GET /users/me` (requires the session cookie). */
export const getCurrentUser = async () => {
  const res = await axiosInstance.get<User>(`${BACKEND_RESOURCES.USERS}/me`);

  return res.data;
};
