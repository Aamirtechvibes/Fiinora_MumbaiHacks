import authService from '../../src/services/authService';
import { loginResponseSchema } from '../../src/services/dtos/auth.dto';
import api from '../../src/services/api';

// Mock api
jest.mock('../../src/services/api');
jest.mock('../../src/services/secureStore');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('login parses and persists', async () => {
    const mockResp = { data: { accessToken: 'at', refreshToken: 'rt', sessionId: 'sid', user: { id: '1', name: 'Test', email: 'test@test.com' } } };
    (api.post as jest.Mock).mockResolvedValue(mockResp);

    const result = await authService.login({ email: 'test@test.com', password: 'pass' });

    expect(loginResponseSchema.parse).toHaveBeenCalled();
    expect(result.accessToken).toBe('at');
  });

  it('refresh uses fetch and parses', async () => {
    const mockData = { accessToken: 'newat', refreshToken: 'newrt', sessionId: 'newsid', user: { id: '1', name: 'Test', email: 'test@test.com' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await authService.refresh('rt', 'sid');

    expect(loginResponseSchema.parse).toHaveBeenCalledWith(mockData);
    expect(result.accessToken).toBe('newat');
  });

  it('register calls api with parsed data', async () => {
    const mockResp = { data: { id: '1', email: 'test@test.com', name: 'Test' } };
    (api.post as jest.Mock).mockResolvedValue(mockResp);

    await authService.register({ email: 'test@test.com', name: 'Test', password: 'pass123' });

    expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'test@test.com' }));
  });
});