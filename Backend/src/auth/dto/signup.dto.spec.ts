import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './signup.dto.js';

const check = async (overrides: Partial<SignUpDto>) => {
  const dto = plainToInstance(SignUpDto, {
    email: 'jane@example.com',
    name: 'Jane',
    password: 'Passw0rd!',
    ...overrides,
  });
  return (await validate(dto)).map((e) => e.property);
};

describe('SignUpDto', () => {
  it('accepts valid input', async () => {
    expect(await check({})).toEqual([]);
  });

  it.each(['not-an-email', 'a@b', ''])(
    'rejects invalid email %j',
    async (email) => {
      expect(await check({ email })).toContain('email');
    },
  );

  it('rejects names shorter than 3 characters', async () => {
    expect(await check({ name: 'Jo' })).toContain('name');
  });

  it.each(['Pa1!', 'Password!!', '12345678!', 'Passw0rdd', 'abcdefg1'])(
    'rejects weak password %j',
    async (password) => {
      expect(await check({ password })).toContain('password');
    },
  );

  it('limits passwords by characters, not bytes', async () => {
    expect(await check({ password: 'Pa1!' + 'é'.repeat(68) })).toEqual([]);
    expect(await check({ password: 'Pa1!' + 'é'.repeat(69) })).toContain(
      'password',
    );
  });
});
