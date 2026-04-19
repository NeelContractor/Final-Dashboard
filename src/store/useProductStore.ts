// src/store/useProductStore.ts
//
// Per-store product cache. Products are keyed by storeUsername so switching
// stores immediately shows cached data if available, and only refetches when
// the cache is empty or explicitly invalidated.
//
// Usage:
//   const { getPage, invalidate } = useProductStore();
//   const cached = getPage(storeUsername, page, pageSize, category);

import { create } from 'zustand';
import { getProducts } from '../services/productService';
import type { Product } from '../types/store';

interface PageKey {
    username:  string;
    page:      number;
    pageSize:  number;
    category?: string;
}

interface PageData {
    products:  Product[];
    total:     number;
    hasMore:   boolean;
    fetchedAt: number;      // ms timestamp
}

// Cache TTL: 60 seconds. After this, a background refetch is triggered.
const CACHE_TTL_MS = 60_000;

function cacheKey({ username, page, pageSize, category }: PageKey): string {
    return `${username}::${page}::${pageSize}::${category ?? ''}`;
}

interface ProductState {
    // ── Cache ─────────────────────────────────────────────────────────────────
    cache: Record<string, PageData>;

    // Per-key loading/error state
    loading: Record<string, boolean>;
    errors:  Record<string, string | null>;

    // ── Actions ───────────────────────────────────────────────────────────────

    /**
     * Fetch a page of products for a store.
     * Returns cached data immediately if fresh; otherwise fetches from API.
     * `force` skips the TTL check and always refetches.
     */
    fetchPage: (key: PageKey, force?: boolean) => Promise<PageData | null>;

    /** Read a cached page synchronously (returns null if not cached). */
    getPage: (key: PageKey) => PageData | null;

    /**
     * Invalidate all cached pages for a store username.
     * Call after create/update/delete so the next read re-fetches.
     */
    invalidate: (username: string) => void;

    /** Invalidate ALL caches (e.g. on logout or store switch). */
    invalidateAll: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
    cache:   {},
    loading: {},
    errors:  {},

    // ── fetchPage ─────────────────────────────────────────────────────────────
    fetchPage: async (key, force = false) => {
        const k        = cacheKey(key);
        const existing = get().cache[k];
        const now      = Date.now();

        // Return fresh cache without a network call
        if (!force && existing && now - existing.fetchedAt < CACHE_TTL_MS) {
        return existing;
        }

        // Already in-flight for this key
        if (get().loading[k]) return existing ?? null;

        set(state => ({ loading: { ...state.loading, [k]: true }, errors: { ...state.errors, [k]: null } }));

        try {
        const res     = await getProducts(key.username, {
            page:     key.page,
            pageSize: key.pageSize,
            ...(key.category ? { category: key.category } : {}),
        });

        const payload = res?.data ?? (res as any);
        const data: PageData = {
            products:  payload?.products ?? [],
            total:     payload?.meta?.total    ?? 0,
            hasMore:   payload?.meta?.hasMore  ?? false,
            fetchedAt: Date.now(),
        };

        set(state => ({
            cache:   { ...state.cache,   [k]: data },
            loading: { ...state.loading, [k]: false },
        }));

        return data;
        } catch (err: any) {
        set(state => ({
            loading: { ...state.loading, [k]: false },
            errors:  { ...state.errors,  [k]: err?.message || 'Failed to fetch products.' },
        }));
        return null;
        }
    },

    // ── getPage ───────────────────────────────────────────────────────────────
    getPage: (key) => get().cache[cacheKey(key)] ?? null,

    // ── invalidate ────────────────────────────────────────────────────────────
    invalidate: (username) =>
        set(state => {
        const prefix = `${username}::`;
        const cache   = Object.fromEntries(Object.entries(state.cache).filter(([k]) => !k.startsWith(prefix)));
        const loading = Object.fromEntries(Object.entries(state.loading).filter(([k]) => !k.startsWith(prefix)));
        const errors  = Object.fromEntries(Object.entries(state.errors).filter(([k]) => !k.startsWith(prefix)));
        return { cache, loading, errors };
        }),

    // ── invalidateAll ─────────────────────────────────────────────────────────
    invalidateAll: () => set({ cache: {}, loading: {}, errors: {} }),
}));