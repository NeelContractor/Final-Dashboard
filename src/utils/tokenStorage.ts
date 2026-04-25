// // src/utils/tokenStorage.ts

// const TOKEN_KEY = "authToken";

// export const tokenStorage = {
//     set:       (token: string) => localStorage.setItem(TOKEN_KEY, token), // TODO add Bearer {token}
//     get:       ()              => localStorage.getItem(TOKEN_KEY), // fix this too
//     getBearer: ()              => {
//         const token = localStorage.getItem(TOKEN_KEY);
//         return token ? `Bearer ${token}` : null;
//     },
//     remove:    ()              => localStorage.removeItem(TOKEN_KEY),
//     exists:    ()              => !!localStorage.getItem(TOKEN_KEY), // ✅ handy boolean check
// };

// src/utils/tokenStorage.ts
 
const TOKEN_KEY = "authToken";
 
export const tokenStorage = {
    set:       (token: string) => localStorage.setItem(TOKEN_KEY, `Bearer ${token}`),
    get:       ()              => localStorage.getItem(TOKEN_KEY),
    getBearer: ()              => localStorage.getItem(TOKEN_KEY), // already stored with Bearer prefix
    remove:    ()              => localStorage.removeItem(TOKEN_KEY),
    exists:    ()              => !!localStorage.getItem(TOKEN_KEY),
};