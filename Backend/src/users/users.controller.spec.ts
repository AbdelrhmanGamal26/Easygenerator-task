import { UsersController } from './users.controller.js';

describe('UsersController', () => {
  it('returns only the public fields of the current user', () => {
    const user = {
      id: 'u1',
      email: 'jane@example.com',
      name: 'Jane Doe',
      password: 'secret',
      refreshTokens: ['h'],
    };
    expect(new UsersController().me(user as never)).toEqual({
      email: 'jane@example.com',
      name: 'Jane Doe',
    });
  });
});
