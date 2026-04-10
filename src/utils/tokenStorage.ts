// src/utils/tokenStorage.ts

const TOKEN_KEY = "authToken";

export const tokenStorage = {
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  get: () => localStorage.getItem(TOKEN_KEY),
  getBearer: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? `Bearer ${token}` : null;
  },
  remove: () => localStorage.removeItem(TOKEN_KEY),
};