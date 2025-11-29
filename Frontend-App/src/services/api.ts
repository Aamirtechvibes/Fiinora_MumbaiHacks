import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_URL } from './api-url';
import * as SecureStore from './secureStore';
import { getAuthStore } from '../store/authStore';

const TIMEOUT = 12000;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

function processQueue(error: unknown, token?: string) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.request.use(async (config) => {
  const store = getAuthStore();
  const token = store.getState().accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  if (config.url === '/auth/login') {
    // eslint-disable-next-line no-console
    console.log('[api] REQUEST /auth/login body:', JSON.stringify(config.data, null, 2));
    if (config.headers) config.headers['Content-Type'] = 'application/json';
  }
  if (process.env.NODE_ENV !== 'production') {
    // attach small debug header
    // eslint-disable-next-line no-console
    console.debug('[api] request', config.method, config.url);
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (process.env.NODE_ENV !== 'production') console.debug('[api] response', res.status, res.config.url);
    return res;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
        // Do not attempt a refresh for auth endpoints (login / refresh / register)
        const rqUrl = originalRequest.url || '';
        if (rqUrl.includes('/auth/login') || rqUrl.includes('/auth/refresh') || rqUrl.includes('/auth/register')) {
          // Let the caller handle auth endpoint failures (e.g., wrong credentials)
          return Promise.reject(error);
        }
        originalRequest._retry = true;
      try {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest });
          }).then(() => api(originalRequest));
        }

        isRefreshing = true;
        const session = await SecureStore.getRefreshSession();
        if (!session) {
          // Helpful debug — include the original request URL
          // eslint-disable-next-line no-console
          console.debug('[api] No refresh session available for retry, originalRequest.url=', rqUrl);
          throw new Error('No refresh session');
        }

        const resp = await refreshClient.post('/auth/refresh', {
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        });

        const newAccessToken = resp.data?.accessToken as string;
        const { refreshToken: newRefresh, sessionId: newSession } = resp.data || {};

        // persist refresh session
        if (newRefresh && newSession) {
          await SecureStore.saveRefreshSession({ refreshToken: newRefresh, sessionId: newSession });
        }

        // update auth store
        const store = getAuthStore();
        store.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (e) {
        processQueue(e, undefined);
        isRefreshing = false;
        // logout
        const store = getAuthStore();
        store.getState().logout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
