import { requestId } from './request-id.js';

const call = (incoming?: string) => {
  const setHeader = vi.fn();
  const id = requestId(
    { headers: { 'x-request-id': incoming } } as never,
    { setHeader } as never,
  );
  return { id, setHeader };
};

describe('requestId', () => {
  it('reuses a well-formed incoming id and echoes it back', () => {
    const { id, setHeader } = call('abc-12345');
    expect(id).toBe('abc-12345');
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', 'abc-12345');
  });

  it('generates a UUID when the id is missing or malformed', () => {
    expect(call().id).toMatch(/^[0-9a-f-]{36}$/);
    expect(call('bad id\n{"x":1}').id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
