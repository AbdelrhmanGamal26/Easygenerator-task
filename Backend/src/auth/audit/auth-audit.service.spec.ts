import { AuthAuditService } from './auth-audit.service.js';

describe('AuthAuditService', () => {
  const logger = { info: vi.fn(), warn: vi.fn() };
  const service = new AuthAuditService(logger as never);

  beforeEach(() => vi.clearAllMocks());

  it('records events at info level as structured audit entries', () => {
    service.record('signin.success', { userId: 'u1' });
    expect(logger.info).toHaveBeenCalledWith(
      { audit: true, event: 'signin.success', userId: 'u1' },
      'signin.success',
    );
  });

  it('raises alerts at warn level', () => {
    service.alert('refresh.reuse_detected', { userId: 'u1' });
    expect(logger.warn).toHaveBeenCalledWith(
      { audit: true, event: 'refresh.reuse_detected', userId: 'u1' },
      'refresh.reuse_detected',
    );
  });
});
