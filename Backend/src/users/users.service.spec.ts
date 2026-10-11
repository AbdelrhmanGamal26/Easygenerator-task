import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  const model = { create: vi.fn(), findOne: vi.fn(), findById: vi.fn() };
  const service = new UsersService(model as never);
  const input = { email: 'a@b.com', name: 'Abc', password: 'hash' };

  beforeEach(() => vi.clearAllMocks());

  it('creates a user', async () => {
    model.create.mockResolvedValue({ id: '1', ...input });
    await expect(service.create(input)).resolves.toMatchObject(input);
  });

  it('maps duplicate key errors to ConflictException', async () => {
    model.create.mockRejectedValue({ code: 11000 });
    await expect(service.create(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rethrows unexpected errors', async () => {
    const error = new Error('boom');
    model.create.mockRejectedValue(error);
    await expect(service.create(input)).rejects.toBe(error);
  });

  it('looks up by lowercased email', async () => {
    const exec = vi.fn().mockResolvedValue(null);
    model.findOne.mockReturnValue({ exec });
    await service.findByEmail('Jane@Example.COM');
    expect(model.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
  });
});
