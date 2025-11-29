import api from './api';
import { loginResponseSchema, registerSchema, loginSchema, refreshSchema, forgotSchema, resetSchema, verifySchema, LoginResponse } from './dtos/auth.dto';
import * as SecureStore from './secureStore';
import { API_URL } from './api-url';

async function register(data: unknown) {
  const parsed = registerSchema.parse(data);
  const resp = await api.post('/auth/register', parsed);
  return resp.data as { id: string; email: string; name: string; emailVerified?: boolean };
}

async function login(data: unknown) {
  const parsed = loginSchema.parse(data);
  console.log('[authService] Calling api.post with:', JSON.stringify(parsed, null, 2));
  const resp = await api.post('/auth/login', parsed);
  console.log('[authService] Backend response:', JSON.stringify(resp.data, null, 2));
  const parsedResp = loginResponseSchema.parse(resp.data);
  // persist refresh tokens
  if (parsedResp.refreshToken && parsedResp.sessionId) {
    console.log('[authService] Saving refresh session with sessionId:', parsedResp.sessionId);
    await SecureStore.saveRefreshSession({ refreshToken: parsedResp.refreshToken, sessionId: parsedResp.sessionId });
  }
  return parsedResp as LoginResponse;
}

async function refresh(refreshToken: string, sessionId: string) {
  refreshSchema.parse({ refreshToken, sessionId });
  // Use a direct fetch so we don't trigger api interceptors
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, sessionId }),
  });
  if (!res.ok) throw new Error('Failed to refresh');
  const data = await res.json();
  const parsed = loginResponseSchema.parse(data);
  if (parsed.refreshToken && parsed.sessionId) {
    await SecureStore.saveRefreshSession({ refreshToken: parsed.refreshToken, sessionId: parsed.sessionId });
  }
  return parsed as LoginResponse;
}

async function logout() {
  await SecureStore.deleteRefreshSession();
}

async function verify(data: unknown) {
  const parsed = verifySchema.parse(data);
  const res = await api.post('/auth/verify', parsed);
  return res.data;
}

async function forgot(data: unknown) {
  const parsed = forgotSchema.parse(data);
  const res = await api.post('/auth/forgot', parsed);
  return res.data;
}

async function reset(data: unknown) {
  const parsed = resetSchema.parse(data);
  const res = await api.post('/auth/reset', parsed);
  return res.data;
}

export default { register, login, refresh, logout, verify, forgot, reset };
