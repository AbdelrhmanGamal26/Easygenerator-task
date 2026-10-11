export interface User {
  email: string;
  name: string;
}

export interface SignupPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface UserState {
  user: User | null;
  isLoggedIn: boolean;
}
