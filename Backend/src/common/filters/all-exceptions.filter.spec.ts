import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

const makeHost = (res: { status: any; json: any }) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', url: '/x' }),
      getResponse: () => res,
    }),
  }) as unknown as ExecutionContext;

describe('AllExceptionsFilter', () => {
  const logger = { error: vi.fn() };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const filter = new AllExceptionsFilter(logger as never);

  beforeEach(() => vi.clearAllMocks());

  it('formats HttpExceptions without logging an error', () => {
    filter.catch(new BadRequestException(['bad']), makeHost(res));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
      message: ['bad'],
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('hides details of unknown errors', () => {
    filter.catch(new Error('db password leaked'), makeHost(res));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Internal server error');
    expect(logger.error).toHaveBeenCalled();
  });
});
