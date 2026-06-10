import { create } from 'zustand';

const storageKey = 'dua-auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem(storageKey, JSON.stringify({ token, user }));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(storageKey);
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => {
    const token = get().token;
    localStorage.setItem(storageKey, JSON.stringify({ token, user }));
    set({ user });
  },
  hydrate: () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const { token, user } = JSON.parse(raw);
      if (token && user) set({ token, user, isAuthenticated: true });
    } catch {
      localStorage.removeItem(storageKey);
    }
  }
}));
