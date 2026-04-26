// src/utils/tokenStorage.ts
 
const TOKEN_KEY = "authToken";
 
export const tokenStorage = {
    set:       (token: string) => localStorage.setItem(TOKEN_KEY, `Bearer ${token}`),
    get:       ()              => localStorage.getItem(TOKEN_KEY),
    getBearer: ()              => localStorage.getItem(TOKEN_KEY), // already stored with Bearer prefix
    remove:    ()              => localStorage.removeItem(TOKEN_KEY),
    exists:    ()              => !!localStorage.getItem(TOKEN_KEY),
};