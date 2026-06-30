import { create } from "zustand";
import type { AuthUser } from "@/api/auth";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Restaure depuis localStorage au démarrage
const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");

export const useAuthStore = create<AuthState>((set, get) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));
