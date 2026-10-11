import axios from 'axios';

/** Extracts a readable message from a backend error response (`message` may be a string or a list of validation messages). */
export const handleErrorMessage = (
  err: unknown,
  fallback = 'Something went wrong',
): string => {
  if (axios.isAxiosError(err)) {
    // Server-side errors may carry internal detail, so show the fallback instead.
    if (err.response && err.response.status >= 500) return fallback;
    const message = err.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (!err.response) return 'Unable to reach the server';
  }
  return fallback;
};
