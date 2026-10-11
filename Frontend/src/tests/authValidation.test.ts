import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from '@/lib/authValidation';

const validSignup = {
  email: 'jane@example.com',
  name: 'Jane',
  password: 'Passw0rd!',
};

const firstMessage = (values: unknown) => {
  const result = signupSchema.safeParse(values);
  return result.success ? null : result.error.issues[0].message;
};

describe('signupSchema', () => {
  it('accepts valid values', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it.each(['plainaddress', 'a@b', 'a..b@example.com', '@example.com'])(
    'rejects invalid email %s',
    (email) => {
      expect(firstMessage({ ...validSignup, email })).toBe(
        'Invalid email address',
      );
    },
  );

  it('rejects names shorter than 3 characters', () => {
    expect(firstMessage({ ...validSignup, name: 'Al' })).toBe(
      'Name must be at least 3 characters',
    );
  });

  it('trims the name before measuring it', () => {
    expect(firstMessage({ ...validSignup, name: ' Al ' })).toBe(
      'Name must be at least 3 characters',
    );
  });

  it.each([
    ['Pw0!', 'Password must be at least 8 characters'],
    ['12345678!', 'Password must contain at least one letter'],
    ['Password!', 'Password must contain at least one number'],
    ['Passw0rdd', 'Password must contain at least one special character'],
  ])('rejects password %s', (password, message) => {
    expect(firstMessage({ ...validSignup, password })).toBe(message);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    expect(result.success).toBe(false);
  });

  it('accepts any non-empty password', () => {
    expect(
      loginSchema.safeParse({ email: 'jane@example.com', password: 'x' })
        .success,
    ).toBe(true);
  });
});
