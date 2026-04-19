// src/store/useAppStore.ts
//
// Central store for user identity, stores list, and active store.
// Any page that needs user/store data reads from here instead of calling userDetails() again.
//
//
// Usage:
//   const { user, stores, activeStore, setActiveStore } = useAppStore();

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userDetails } from '../services/userService';
import { tokenStorage } from '../utils/tokenStorage';
import type { User, Store } from '../types/store';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AppState {
    // ── Data ───────────────────────────────────────────────────────────────────
    user:         User | null;
    stores:       Store[];
    activeStore:  Store | null;

    // ── Status ─────────────────────────────────────────────────────────────────
    authStatus:   AuthStatus;
    authError:    string | null;

    // ── Actions ────────────────────────────────────────────────────────────────

    /**
     * Boot the app: verify token + load user/stores.
     * Safe to call from multiple pages — if already authenticated, is a no-op.
     */
    bootstrap: () => Promise<'ok' | 'no-token' | 'no-store' | 'unauthorized' | 'error'>;

    /** Switch the active store (resets per-store caches in other stores). */
    setActiveStore: (store: Store) => void;

    /** Update a single store inside the list (after edit/save). */
    updateStoreInList: (updated: Store) => void;

    /** Clear everything on logout. */
    clear: () => void;
}

export const useAppStore = create<AppState>()(
    // persist keeps authStatus + activeStore across page refreshes
    persist(
        (set, get) => ({
        user:        null,
        stores:      [],
        activeStore: null,
        authStatus:  'idle',
        authError:   null,

        // ── bootstrap ──────────────────────────────────────────────────────────
        bootstrap: async () => {
            // Already verified this session → skip the network call
            if (get().authStatus === 'authenticated') return 'ok';

            const token = tokenStorage.get();
            if (!token) {
                set({ authStatus: 'unauthenticated', user: null, stores: [], activeStore: null });
                return 'no-token';
            }

            set({ authStatus: 'loading', authError: null });

            try {
                const response = await userDetails();
                const user   = response?.data;
                const stores = user?.stores ?? [];

                if (!stores.length) {
                    set({ authStatus: 'unauthenticated', user, stores: [], activeStore: null });
                    return 'no-store';
                }

                // Keep existing activeStore if it's still in the list; otherwise default to first
                const current = get().activeStore;
                const activeStore =
                    (current && stores.find(s => s.id === current.id)) ?? stores[0];

                set({ authStatus: 'authenticated', user, stores, activeStore, authError: null });
                return 'ok';
            } catch (err: any) {
                const is401 =
                    err?.status === 401 ||
                    err?.message?.toLowerCase().includes('unauthorized');

                if (is401) {
                    tokenStorage.remove();
                    set({ authStatus: 'unauthenticated', user: null, stores: [], activeStore: null });
                    return 'unauthorized';
                }

                // Network/server error — keep token, surface error
                set({ authStatus: 'error' as any, authError: err?.message || 'Failed to load profile.' });
                return 'error';
            }
        },

        // ── setActiveStore ─────────────────────────────────────────────────────
        setActiveStore: (store) => set({ activeStore: store }),

        // ── updateStoreInList ──────────────────────────────────────────────────
        updateStoreInList: (updated) =>
            set(state => ({
                stores: state.stores.map(s => s.id === updated.id ? updated : s),
                activeStore:
                    state.activeStore?.id === updated.id ? updated : state.activeStore,
            })),

        // ── clear ──────────────────────────────────────────────────────────────
        clear: () =>
            set({
                user:        null,
                stores:      [],
                activeStore: null,
                authStatus:  'unauthenticated',
                authError:   null,
            }),
        }),
        {
            name: 'app-store',
            // Only persist lightweight identity — never raw tokens
            partialize: (state) => ({
                user:        state.user,
                stores:      state.stores,
                activeStore: state.activeStore,
                // Don't persist authStatus so we always re-verify on hard reload
            }),
        }
    )
);