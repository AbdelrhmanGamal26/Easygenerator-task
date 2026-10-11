import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { handleErrorMessage } from '@/lib/utils';

const axiosError = (data?: unknown) =>
  new AxiosError(
    'failed',
    undefined,
    undefined,
    undefined,
    data === undefined ? undefined : ({ status: 400, data } as AxiosResponse),
  );

describe('handleErrorMessage', () => {
  it('returns a string message from the backend', () => {
    expect(
      handleErrorMessage(axiosError({ message: 'Invalid credentials' })),
    ).toBe('Invalid credentials');
  });

  it('joins a list of validation messages', () => {
    expect(handleErrorMessage(axiosError({ message: ['a', 'b'] }))).toBe(
      'a. b',
    );
  });

  it('reports an unreachable server when there is no response', () => {
    expect(handleErrorMessage(axiosError())).toBe('Unable to reach the server');
  });

  it('falls back for non-axios errors', () => {
    expect(handleErrorMessage(new Error('x'), 'login failed')).toBe(
      'login failed',
    );
  });
});
