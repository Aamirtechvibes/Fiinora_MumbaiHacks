import * as SecureStore from 'expo-secure-store';

const KEY = 'fiinora_refresh_session_v1';

export type RefreshSession = {
  refreshToken: string;
  sessionId: string;
};

export async function saveRefreshSession(session: RefreshSession): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session), { keychainService: KEY });
}

export async function getRefreshSession(): Promise<RefreshSession | null> {
  const raw = await SecureStore.getItemAsync(KEY, { keychainService: KEY });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RefreshSession;
  } catch (e) {
    await deleteRefreshSession();
    return null;
  }
}

export async function deleteRefreshSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY, { keychainService: KEY });
}

export default { saveRefreshSession, getRefreshSession, deleteRefreshSession };
