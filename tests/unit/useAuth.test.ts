import { renderHook, act } from '@testing-library/react-hooks';
import useAuth from '../../src/hooks/useAuth';
import * as authService from '../../src/services/authService';
import * as SecureStore from '../../src/services/secureStore';
import { useAuthStore } from '../../src/store/authStore';

// Mock services
jest.mock('../../src/services/authService');
jest.mock('../../src/services/secureStore');
jest.mock('../../src/store/authStore');

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bootstraps successfully with refresh', async () => {
    const mockSession = { refreshToken: 'rt', sessionId: 'sid' };
    const mockResp = { accessToken: 'at', user: { id: '1', email: 'test@test.com', name: 'Test' } };
    (SecureStore.getRefreshSession as jest.Mock).mockResolvedValue(mockSession);
    (authService.default.refresh as jest.Mock).mockResolvedValue(mockResp);

    const { result, waitForNextUpdate } = renderHook(() => useAuth());
    await waitForNextUpdate();

    expect(result.current.ready).toBe(true);
    expect(useAuthStore().setAccessToken).toHaveBeenCalledWith('at');
  });

  it('login succeeds', async () => {
    const mockResp = { accessToken: 'at', user: { id: '1', email: 'test@test.com', name: 'Test' } };
    (authService.default.login as jest.Mock).mockResolvedValue(mockResp);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'pass' });
    });

    expect(useAuthStore().setAccessToken).toHaveBeenCalledWith('at');
  });

  it('login fails with toast', async () => {
    (authService.default.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await expect(result.current.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow();
    });
  });

  it('logout clears store', async () => {
    (SecureStore.deleteRefreshSession as jest.Mock).mockResolvedValue();

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore().logout).toHaveBeenCalled();
  });
});