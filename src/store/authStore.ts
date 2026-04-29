import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  username: string;
  password: string;
  rememberMe: boolean;
  login: (username: string, password: string, remember: boolean) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
}

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: DEFAULT_USERNAME,
      password: DEFAULT_PASSWORD,
      rememberMe: false,
      login: (username: string, password: string, remember: boolean) => {
        const state = get();
        const storedUser = state.username || DEFAULT_USERNAME;
        const storedPass = state.password || DEFAULT_PASSWORD;
        if (username === storedUser && password === storedPass) {
          set({ isAuthenticated: true, rememberMe: remember });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, rememberMe: false });
      },
      changePassword: (currentPassword: string, newPassword: string) => {
        const state = get();
        const storedPass = state.password || DEFAULT_PASSWORD;
        if (currentPassword === storedPass) {
          set({ password: newPassword });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'lapkin-auth',
      partialize: (state) => ({
        username: state.username,
        password: state.password,
        isAuthenticated: state.rememberMe ? state.isAuthenticated : false,
        rememberMe: state.rememberMe,
      }),
    }
  )
);
