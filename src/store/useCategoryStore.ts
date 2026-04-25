// src/store/useCategoryStore.ts

import { create } from 'zustand';
import { getCategories } from '../services/productService';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number;
  displayOrder?: number;
  active?: boolean;
}

interface CacheEntry {
  categories: Category[];
  fetchedAt:  number;
  // true  = request succeeded (even if array is empty — valid 200)
  // false = request failed (network/server error)
  ok: boolean;
}

const CACHE_TTL_MS = 60_000;

interface CategoryState {
  cache:   Record<string, CacheEntry>;
  loading: Record<string, boolean>;
  errors:  Record<string, string | null>;

  /**
   * Returns:
   *   Category[]  — success (may be an empty array if store has no categories yet)
   *   null        — real request error (network failure, 4xx, 5xx)
   */
  fetchCategories: (storeUsername: string, force?: boolean) => Promise<Category[] | null>;
  getCategories:   (storeUsername: string) => Category[] | null;
  /** Whether the last fetch for this store succeeded (even if empty). */
  wasSuccessful:   (storeUsername: string) => boolean | null;
  invalidate:      (storeUsername: string) => void;
  invalidateAll:   () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  cache:   {},
  loading: {},
  errors:  {},

  fetchCategories: async (storeUsername, force = false) => {
    const existing = get().cache[storeUsername];
    const now      = Date.now();

    // Return fresh cache — including a valid empty array
    if (!force && existing && now - existing.fetchedAt < CACHE_TTL_MS) {
      return existing.ok ? existing.categories : null;
    }
    // Already in-flight
    if (get().loading[storeUsername]) {
      return existing ? (existing.ok ? existing.categories : null) : null;
    }

    set(s => ({
      loading: { ...s.loading, [storeUsername]: true },
      errors:  { ...s.errors,  [storeUsername]: null },
    }));

    try {
      const res = await getCategories(storeUsername);

      // Normalise: handle { data: [...] } wrapper or bare array
      const list: Category[] = Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray(res)
          ? (res as any)
          : [];

      // Success — even an empty list is a valid 200
      const entry: CacheEntry = { categories: list, fetchedAt: Date.now(), ok: true };
      set(s => ({
        cache:   { ...s.cache,   [storeUsername]: entry },
        loading: { ...s.loading, [storeUsername]: false },
      }));
      return list;

    } catch (err: any) {
      // Real error — network failure, 4xx, 5xx
      set(s => ({
        loading: { ...s.loading, [storeUsername]: false },
        errors:  { ...s.errors,  [storeUsername]: err?.message || 'Failed to fetch categories.' },
        cache: {
          ...s.cache,
          [storeUsername]: { categories: [], fetchedAt: Date.now(), ok: false },
        },
      }));
      return null; // null = error — caller should show error UI
    }
  },

  getCategories:  (u) => get().cache[u]?.categories ?? null,
  wasSuccessful:  (u) => get().cache[u]?.ok ?? null,  // null = not fetched yet

  invalidate: (storeUsername) =>
    set(s => {
      const { [storeUsername]: _c, ...cache   } = s.cache;
      const { [storeUsername]: _l, ...loading } = s.loading;
      const { [storeUsername]: _e, ...errors  } = s.errors;
      return { cache, loading, errors };
    }),

  invalidateAll: () => set({ cache: {}, loading: {}, errors: {} }),
}));