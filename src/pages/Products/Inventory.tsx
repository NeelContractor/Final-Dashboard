// src/pages/Products/Inventory.tsx

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useProductStore } from '../../store/useProductStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuth } from '../../hooks/useAuth';
import { updateProduct } from '../../services/productService';
import CategorySelector from '../Categories/CategorySelector';
import type { Product, Store, UpdateProductRequestBody } from '../../types/store';

// ─── Types ─────────────────────────────────────────────────────────────────────

type InventoryItem = {
  id:             string;
  name:           string;
  slug:           string;
  categoryIds:    number[];
  imageUrl:       string;
  stock:          number;
  inStock:        boolean;
  reorderPoint:   number;
  price:          number;
  description:    string;
  compareAtPrice: number;
  currency:       string;
  images:         string[];
  isFeatured:     boolean;
  tags:           string[];
};

type EditForm = Omit<UpdateProductRequestBody, 'images' | 'tags'> & {
  imagesInput: string;
  tagsInput:   string;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const REORDER_POINT = 10;
const PAGE_SIZE     = 50;

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30 dark:placeholder:text-slate-500";
const lbl = "block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toInventoryItem = (p: Product): InventoryItem => ({
  id:             p.id,
  name:           p.name,
  slug:           p.slug,
  categoryIds:    p.categoryIds ?? [],
  imageUrl:       p.imageUrl ?? '',
  stock:          p.stockCount,
  inStock:        p.inStock,
  reorderPoint:   REORDER_POINT,
  price:          p.price,
  description:    p.description ?? '',
  compareAtPrice: p.compareAtPrice ?? 0,
  currency:       p.currency ?? 'INR',
  images:         p.images ?? [],
  isFeatured:     p.isFeatured ?? false,
  tags:           p.tags ?? [],
});

const itemToForm = (item: InventoryItem): EditForm => ({
  name:           item.name,
  slug:           item.slug,
  description:    item.description,
  price:          item.price,
  compareAtPrice: item.compareAtPrice,
  currency:       item.currency,
  imageUrl:       item.imageUrl,
  imagesInput:    item.images.join(', '),
  categoryIds:    item.categoryIds,
  inStock:        item.inStock,
  stockCount:     item.stock,
  isFeatured:     item.isFeatured,
  tagsInput:      item.tags.join(', '),
});

const getStatus = (stock: number, inStock: boolean, reorder: number) => {
  if (!inStock || stock === 0)
    return { label: 'Out of Stock', badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500'    };
  if (stock <= reorder)
    return { label: 'Low Stock',    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' };
  return   { label: 'In Stock',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    dot: 'bg-green-500'  };
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Inventory() {
  const navigate = useNavigate();
  const { isVerifying } = useAuth();

  const { stores, activeStore, setActiveStore }    = useAppStore();
  const { fetchPage, errors: cacheErrors, invalidate } = useProductStore();
  const { fetchCategories, getCategories }         = useCategoryStore();

  const storeUsername    = activeStore?.username ?? '';
  const cachedCategories = getCategories(storeUsername) ?? [];
  const catMap           = new Map<number, string>(cachedCategories.map(c => [c.id, c.name]));
  const resolveNames     = (ids: number[]) =>
    ids.length === 0 ? '—' : ids.map(id => catMap.get(id) ?? `#${id}`).join(', ');
  const activeCategories = cachedCategories.filter(c => c.active !== false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [items, setItems]                 = useState<InventoryItem[]>([]);
  const [loading, setLoading]             = useState(false);
  const [fetchError, setFetchError]       = useState<string | null>(null); // null = no error, string = real API error
  const [storeDropdown, setStoreDropdown] = useState(false);

  const [search, setSearch]             = useState('');
  const [filterCatId, setFilterCatId]   = useState<number | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Edit dialog
  const [editItem, setEditItem]   = useState<InventoryItem | null>(null);
  const [editForm, setEditForm]   = useState<EditForm | null>(null);
  const [editTab, setEditTab]     = useState<'basic' | 'pricing' | 'inventory'>('basic');
  const [saving, setSaving]       = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (storeUsername) fetchCategories(storeUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUsername]);

  const fetchInventory = useCallback(async (force = false) => {
    if (!storeUsername) return;
    setLoading(true);
    setFetchError(null); // clear error before each attempt

    const result = await fetchPage({ username: storeUsername, page: 1, pageSize: PAGE_SIZE }, force);

    if (result) {
      // Success — even an empty array is valid, show empty state UI, not an error
      setItems(result.products.map(toInventoryItem));
    } else {
      // fetchPage returned null — a real network/API error occurred
      const key = `${storeUsername}::1::${PAGE_SIZE}::`;
      const knownError = cacheErrors[key];
      // Only show the error banner if the store recorded an actual error message.
      // Don't fall back to a generic string for an empty-but-successful response.
      if (knownError) {
        setFetchError(knownError);
      }
      // If no knownError, leave fetchError null — empty state UI handles the display
    }

    setLoading(false);
  }, [storeUsername, fetchPage, cacheErrors]);

  useEffect(() => {
    if (storeUsername && !isVerifying) fetchInventory();
  }, [storeUsername, isVerifying, fetchInventory]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = items.filter(item => {
    const q           = search.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    const matchCat    = filterCatId === 'All' || item.categoryIds.includes(filterCatId as number);
    const status      = getStatus(item.stock, item.inStock, item.reorderPoint).label;
    const matchStatus = filterStatus === 'All' || status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalStock  = items.reduce((s, i) => s + i.stock, 0);
  const lowCount    = items.filter(i => i.stock > 0 && i.inStock && i.stock <= i.reorderPoint).length;
  const outCount    = items.filter(i => !i.inStock || i.stock === 0).length;
  const activeCount = items.filter(i => i.inStock && i.stock > i.reorderPoint).length;

  // ── Store switch ───────────────────────────────────────────────────────────

  const switchStore = (store: Store) => {
    setActiveStore(store);
    setStoreDropdown(false);
    setFilterCatId('All');
    setFilterStatus('All');
    setSearch('');
    setItems([]);
    setFetchError(null);
    setEditItem(null);
    setEditForm(null);
  };

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm(itemToForm(item));
    setEditTab('basic');
    setEditError(null);
  };

  const closeEdit = () => { setEditItem(null); setEditForm(null); setEditError(null); };

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setEditForm(f => f ? { ...f, [key]: value } : f);

  const handleSave = async () => {
    if (!editForm || !editItem) return;
    if (!editForm.name.trim())             { setEditTab('basic');     setEditError('Product name is required.');       return; }
    if (!editForm.slug.trim())             { setEditTab('basic');     setEditError('Slug is required.');               return; }
    if (editForm.categoryIds.length === 0) { setEditTab('basic');     setEditError('At least one category required.'); return; }
    if (editForm.price <= 0)               { setEditTab('pricing');   setEditError('Price must be greater than 0.');   return; }

    setSaving(true);
    setEditError(null);

    const body: UpdateProductRequestBody = {
      name:           editForm.name.trim(),
      slug:           editForm.slug.trim(),
      description:    editForm.description.trim(),
      price:          editForm.price,
      compareAtPrice: editForm.compareAtPrice,
      currency:       editForm.currency,
      imageUrl:       editForm.imageUrl.trim(),
      images:         editForm.imagesInput.split(',').map(s => s.trim()).filter(Boolean),
      categoryIds:    editForm.categoryIds,
      inStock:        editForm.inStock,
      stockCount:     editForm.stockCount,
      isFeatured:     editForm.isFeatured,
      tags:           editForm.tagsInput.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      await updateProduct(storeUsername, editItem.slug, body);
      // Optimistic update — reflect changes immediately without refetch
      setItems(prev => prev.map(it =>
        it.id !== editItem.id ? it : {
          ...it,
          name:           body.name,
          slug:           body.slug,
          description:    body.description,
          price:          body.price,
          compareAtPrice: body.compareAtPrice,
          currency:       body.currency,
          imageUrl:       body.imageUrl,
          images:         body.images,
          categoryIds:    body.categoryIds,
          inStock:        body.inStock,
          stock:          body.stockCount,
          isFeatured:     body.isFeatured,
          tags:           body.tags,
        }
      ));
      invalidate(storeUsername); // bust product cache for other pages
      closeEdit();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-slate-900">
        <p className="text-gray-500 dark:text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-5 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          {stores.length <= 1 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {storeUsername ? `@${storeUsername} · ` : ''}Track stock levels across your store
            </p>
          ) : (
            <div className="relative mt-1.5">
              <button onClick={() => setStoreDropdown(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {activeStore?.logoUrl && <img src={activeStore.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <span className="text-slate-500 dark:text-slate-400">@{activeStore?.username}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-md px-1.5 py-0.5 font-semibold">{stores.length} stores</span>
                <span className="text-slate-400 text-xs">▾</span>
              </button>
              {storeDropdown && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setStoreDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1.5 z-[101] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl py-1.5 min-w-[240px]">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-2 pb-1">Switch Store</p>
                    {stores.map(store => (
                      <button key={store.id} onClick={() => switchStore(store)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${activeStore?.id === store.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {store.logoUrl ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-base">🏪</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${activeStore?.id === store.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{store.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">@{store.username}</p>
                        </div>
                        {activeStore?.id === store.id && <span className="text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => fetchInventory(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">🔄 Refresh</button>
          <button onClick={() => navigate('/products/add')} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">+ Add Product</button>
        </div>
      </div>

      {/* ── Error Banner — only for real API errors, never for empty results ── */}
      {fetchError && !loading && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <span>⚠️ {fetchError}</span>
          <button onClick={() => fetchInventory(true)} className="ml-4 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { label: 'Total Stock Units', value: loading ? '—' : totalStock.toLocaleString(), icon: '📦', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20'    },
          { label: 'Active Items',      value: loading ? '—' : activeCount,                  icon: '✅', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20'  },
          { label: 'Low Stock',         value: loading ? '—' : lowCount,                     icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Out of Stock',      value: loading ? '—' : outCount,                     icon: '❌', color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20'      },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">{s.label}</span>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center text-sm shrink-0`}>{s.icon}</div>
            </div>
            {loading
              ? <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              : <p className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</p>}
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or slug..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-colors dark:placeholder:text-slate-500" />
          </div>
          <select
            value={filterCatId === 'All' ? '' : String(filterCatId)}
            onChange={e => setFilterCatId(e.target.value === '' ? 'All' : Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
            <option value="">All Categories</option>
            {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-48" /><div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded w-24" /></div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-16" />
                <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : !fetchError ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  {['Product', 'Slug', 'Categories', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map(item => {
                  const status   = getStatus(item.stock, item.inStock, item.reorderPoint);
                  const catNames = resolveNames(item.categoryIds);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-lg">📦</span>}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.name}</p>
                            {item.isFeatured && <span className="text-[10px] font-bold text-amber-500">⭐ Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.slug}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg max-w-[160px] truncate block" title={catNames}>{catNames}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        ₹{item.price.toLocaleString()}
                        {item.compareAtPrice > item.price && <span className="text-xs text-slate-400 line-through ml-1.5">₹{item.compareAtPrice.toLocaleString()}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-bold ${item.stock === 0 ? 'text-red-500' : item.stock <= item.reorderPoint ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.stock}
                          {item.stock > 0 && item.stock <= item.reorderPoint && <span className="text-[10px] text-red-500 ml-1 font-bold">LOW</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${status.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(item)}
                            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap">
                            ✏️ Edit
                          </button>
                          {item.stock <= item.reorderPoint && (
                            <button onClick={() => navigate('/products/add')}
                              className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors whitespace-nowrap">
                              Reorder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Empty state — shown when fetch succeeded but list is empty */}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No products found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting filters or add your first product</p>
              </div>
            )}
          </div>
        ) : null /* fetchError is shown in the banner above, table is hidden */}

        {!loading && !fetchError && (lowCount > 0 || outCount > 0) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <span className="text-lg shrink-0">⚠️</span>
            <span className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
              {outCount > 0 && `${outCount} item${outCount > 1 ? 's' : ''} out of stock`}
              {outCount > 0 && lowCount > 0 && ' · '}
              {lowCount > 0 && `${lowCount} item${lowCount > 1 ? 's' : ''} running low`}. Consider restocking soon.
            </span>
            <button onClick={() => setFilterStatus('Low Stock')}
              className="sm:ml-auto shrink-0 bg-yellow-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap">
              View Low Stock →
            </button>
          </div>
        )}
      </div>

      {/* ── Edit Product Dialog ── */}
      {editItem && editForm && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Product</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{editItem.slug}</p>
              </div>
              <button onClick={closeEdit} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-lg leading-none">×</button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              {([
                { id: 'basic',     label: '📝 Basic',     desc: 'Name, categories, images' },
                { id: 'pricing',   label: '💰 Pricing',   desc: 'Price, MRP, currency'     },
                { id: 'inventory', label: '📦 Inventory', desc: 'Stock, availability'      },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setEditTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-center transition-all border-b-2 ${editTab === tab.id ? 'border-blue-600 bg-white dark:bg-slate-800 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">

              {editTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Product Name <span className="text-red-500">*</span></label>
                    <input value={editForm.name} onChange={e => updateField('name', e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Slug <span className="text-red-500">*</span></label>
                    <input value={editForm.slug} onChange={e => updateField('slug', e.target.value)} className={`${inp} font-mono text-blue-600 dark:text-blue-400`} />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">⚠️ Changing slug will break existing links</p>
                  </div>
                  <CategorySelector
                    storeUsername={storeUsername}
                    selectedIds={editForm.categoryIds}
                    onChange={ids => updateField('categoryIds', ids)}
                    allowCreate
                    required
                  />
                  <div>
                    <label className={lbl}>Description</label>
                    <textarea value={editForm.description} onChange={e => updateField('description', e.target.value)} rows={3} className={`${inp} resize-none leading-relaxed`} />
                  </div>
                  <div>
                    <label className={lbl}>Tags <span className="text-slate-400 font-normal text-xs">(comma separated)</span></label>
                    <input value={editForm.tagsInput} onChange={e => updateField('tagsInput', e.target.value)} placeholder="wireless, earbuds" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Main Image URL</label>
                    <input value={editForm.imageUrl} onChange={e => updateField('imageUrl', e.target.value)} placeholder="https://..." className={inp} />
                    {editForm.imageUrl && (
                      <img src={editForm.imageUrl} alt="preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <div>
                    <label className={lbl}>Additional Images <span className="text-slate-400 font-normal text-xs">(comma separated)</span></label>
                    <input value={editForm.imagesInput} onChange={e => updateField('imagesInput', e.target.value)} placeholder="https://img1.com, https://img2.com" className={inp} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isFeatured" checked={editForm.isFeatured} onChange={e => updateField('isFeatured', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                    <label htmlFor="isFeatured" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">⭐ Mark as Featured</label>
                  </div>
                </div>
              )}

              {editTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Selling Price <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                        <input type="number" min="0.01" step="0.01" value={editForm.price || ''} onChange={e => updateField('price', Number(e.target.value))} placeholder="0.00" className={`${inp} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>MRP / Compare At</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                        <input type="number" min="0" step="0.01" value={editForm.compareAtPrice || ''} onChange={e => updateField('compareAtPrice', Number(e.target.value))} placeholder="0.00" className={`${inp} pl-7`} />
                      </div>
                    </div>
                  </div>
                  {editForm.compareAtPrice > editForm.price && editForm.price > 0 && (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">{Math.round((1 - editForm.price / editForm.compareAtPrice) * 100)}% OFF</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Customers save ₹{(editForm.compareAtPrice - editForm.price).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Currency</label>
                    <select value={editForm.currency} onChange={e => updateField('currency', e.target.value)} className={inp}>
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="USD">USD ($) — US Dollar</option>
                    </select>
                  </div>
                </div>
              )}

              {editTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Stock Count <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={editForm.stockCount || ''} onChange={e => updateField('stockCount', Number(e.target.value))} placeholder="0" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Availability</label>
                      <select value={editForm.inStock ? 'true' : 'false'} onChange={e => updateField('inStock', e.target.value === 'true')} className={inp}>
                        <option value="true">✅ In Stock</option>
                        <option value="false">❌ Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div className={`rounded-xl p-4 border ${!editForm.inStock || editForm.stockCount === 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : editForm.stockCount <= REORDER_POINT ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Preview</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {!editForm.inStock || editForm.stockCount === 0 ? '❌ Out of Stock' : editForm.stockCount <= REORDER_POINT ? '⚠️ Low Stock' : '✅ In Stock'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {editError && (
              <div className="mx-6 mb-0 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm shrink-0 flex items-center justify-between">
                <span>⚠️ {editError}</span>
                <button onClick={() => setEditError(null)} className="ml-2 text-lg leading-none text-red-400 hover:text-red-600">×</button>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 rounded-b-2xl">
              <div className="flex gap-2 mr-auto">
                {editTab !== 'basic'     && <button onClick={() => setEditTab(editTab === 'inventory' ? 'pricing' : 'basic')}    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">← Back</button>}
                {editTab !== 'inventory' && <button onClick={() => setEditTab(editTab === 'basic' ? 'pricing' : 'inventory')}    className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 transition-colors">Next →</button>}
              </div>
              <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}