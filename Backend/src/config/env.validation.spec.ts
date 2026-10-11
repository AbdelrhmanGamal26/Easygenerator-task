import 'reflect-metadata';
import { validateEnv } from './env.validation.js';

const base = {
  MONGODB_URI: 'mongodb://localhost/test',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults', () => {
    const env = validateEnv(base);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(7);
    expect(env.TRUST_PROXY).toBe(0);
  });

  it('normalises CORS origins', () => {
    const env = validateEnv({
      ...base,
      CORS_ORIGIN: ' http://a.com/ , http://b.com:3000// ',
    });
    expect(env.CORS_ORIGIN).toBe('http://a.com,http://b.com:3000');
  });

  it('rejects the placeholder secret in production only', () => {
    const secret = 'change-me-change-me-change-me-change-me';
    expect(() =>
      validateEnv({ ...base, JWT_SECRET: secret, NODE_ENV: 'production' }),
    ).toThrow('placeholder');
    expect(() => validateEnv({ ...base, JWT_SECRET: secret })).not.toThrow();
  });
});
