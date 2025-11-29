import { AuthState } from '../store/authStore';
import { useCallback, useEffect, useState } from 'react';
import authService from '../services/authService';
import * as SecureStore from '../services/secureStore';
import useAuthStore from '../store/authStore';
import { LoginDto, RegisterDto } from '../services/dtos/auth.dto';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';

function toast(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}

export function useAuth() {
  const setAccessToken = useAuthStore((state: AuthState) => state.setAccessToken);
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const setReady = useAuthStore((state: AuthState) => state.setReady);
  const logoutStore = useAuthStore((state: AuthState) => state.logout);
  const ready = useAuthStore((state: AuthState) => state.ready);
  const router = useRouter();

  const bootstrap = useCallback(async () => {
    try {
      const session = await SecureStore.getRefreshSession();
      if (!session) {
        setReady(true);
        return;
      }
      const resp = await authService.refresh(session.refreshToken, session.sessionId);
      setAccessToken(resp.accessToken);
      setUser(resp.user as any);
    } catch (e) {
      await SecureStore.deleteRefreshSession();
      toast('Session expired. Please login.');
    } finally {
      setReady(true);
    }
  }, [setAccessToken, setUser, setReady]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (data: LoginDto) => {
    try {
      console.log('[useAuth.login] Starting login with email:', data.email);
      const resp = await authService.login(data);
      console.log('[useAuth.login] Login response received:', JSON.stringify(resp, null, 2));
      
      // Store tokens and user
      console.log('[useAuth.login] Storing accessToken:', resp.accessToken.substring(0, 20) + '...');
      setAccessToken(resp.accessToken);
      console.log('[useAuth.login] Storing user:', resp.user.email);
      setUser(resp.user as any);
      console.log('[useAuth.login] Auth state updated');
      
      // Navigate to main app tabs after login
      toast('Entering app...');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      
      return resp;
    } catch (e: unknown) {
      const message = (e as Error).message || 'Login failed';
      console.error('[useAuth.login] Error:', message, e);
      toast(message);
      throw e;
    }
  }, [setAccessToken, setUser, router]);

  const register = useCallback(async (data: RegisterDto) => {
    try {
      const resp = await authService.register(data);
      
      // After registration, redirect to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
      
      return resp;
    } catch (e: unknown) {
      const message = (e as Error).message || 'Register failed';
      toast(message);
      throw e;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      logoutStore();
    }
  }, [logoutStore]);

  const forgot = useCallback(async (data: { email: string }) => {
    try {
      await authService.forgot(data);
      toast('Reset link sent to your email');
    } catch (e: unknown) {
      const message = (e as Error).message || 'Forgot password failed';
      toast(message);
      throw e;
    }
  }, []);

  const verify = useCallback(async (data: { token: string }) => {
    try {
      await authService.verify(data);
      toast('Email verified successfully');
    } catch (e: unknown) {
      const message = (e as Error).message || 'Verification failed';
      toast(message);
      throw e;
    }
  }, []);

  const reset = useCallback(async (data: { token: string; password: string }) => {
    try {
      await authService.reset(data);
      toast('Password reset successfully');
    } catch (e: unknown) {
      const message = (e as Error).message || 'Reset failed';
      toast(message);
      throw e;
    }
  }, []);

  return {
    ready,
    bootstrap,
    login,
    register,
    logout,
    forgot,
    verify,
    reset,
  } as const;
}

export default useAuth;
