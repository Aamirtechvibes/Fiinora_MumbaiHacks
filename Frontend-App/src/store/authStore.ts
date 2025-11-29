// Use require to avoid module interop issues in Metro bundler
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _zustand = require('zustand');
// Support several possible runtime shapes:
// - default export is the create function
// - named export `create` is present
// - module itself is the create function
const create = _zustand.default ?? _zustand.create ?? _zustand;
import { User } from '../types/user';

type AuthState = {
  accessToken: string | null;
  user: User | null;
  ready: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setReady: (r: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  ready: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setReady: (r) => set({ ready: r }),
  logout: () => set({ accessToken: null, user: null }),
}));

// helper to avoid direct import cycles in api
export function getAuthStore() {
  return useAuthStore;
}

export default useAuthStore;
