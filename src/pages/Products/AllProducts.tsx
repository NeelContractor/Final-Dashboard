// src/pages/Products/AllProducts.tsx

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { createProduct, deleteProduct } from '../../services/productService';
import { useAppStore } from '../../store/useAppStore';
import { useProductStore } from '../../store/useProductStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuth } from '../../hooks/useAuth';
import type { Product, CreateProductRequestBody, Store } from '../../types/store';
import CategorySelector from '../Categories/CategorySelector';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getStatus = (p: Product) => {
  if (!p.inStock || p.stockCount === 0) return 'Out of Stock';
  if (p.stockCount <= 10) return 'Low Stock';
  return 'Active';
};

const statusStyle: Record<string, string> = {
  'Active':       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Low Stock':    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Out of Stock': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const statusDot: Record<string, string> = {
  'Active':       'bg-green-500',
  'Low Stock':    'bg-yellow-500',
  'Out of Stock': 'bg-red-500',
};

const emptyForm = (): CreateProductRequestBody => ({
  name: '', description: '', price: 0, compareAtPrice: 0,
  currency: 'INR', imageUrl: '', images: [], categoryIds: [],
  inStock: true, stockCount: 0, isFeatured: false, tags: [], slug: '',
});

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const PAGE_SIZE = 10;

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AllProducts() {
  const navigate = useNavigate();
  const { isVerifying } = useAuth();

  const { stores, activeStore, setActiveStore } = useAppStore();
  const { fetchPage, errors: cacheErrors, invalidate } = useProductStore();
  const { fetchCategories, getCategories } = useCategoryStore();

  const storeUsername = activeStore?.username ?? '';

  // Shared category cache — resolved once, used everywhere
  const cachedCategories = getCategories(storeUsername) ?? [];
  const catMap = new Map<number, string>(cachedCategories.map(c => [c.id, c.name]));
  const resolveCategoryNames = (ids: number[]): string =>
    ids.length === 0 ? '—' : ids.map(id => catMap.get(id) ?? `#${id}`).join(', ');

  // Active top-level categories for filter bar
  const activeCategories = cachedCategories.filter(c => c.active !== false);

  const [products, setProducts]       = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);
  const [hasMore, setHasMore]         = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null); // null = no error, string = real API error
  const [storeDropdown, setStoreDropdown] = useState(false);

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCatId, setFilterCatId]   = useState<number | 'All'>('All');
  const [sortBy, setSortBy]             = useState('name');
  const [viewMode, setViewMode]         = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);

  const [showDialog, setShowDialog]  = useState(false);
  const [form, setForm]              = useState<CreateProductRequestBody>(emptyForm());
  const [tagsInput, setTagsInput]    = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [saving, setSaving]          = useState(false);
  const [formError, setFormError]    = useState<string | null>(null);
  const [activeTab, setActiveTab]    = useState<'basic' | 'pricing' | 'inventory'>('basic');

  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; name: string } | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30 dark:placeholder:text-slate-500";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300";

  // ── Fetch categories once — warms shared cache for Inventory & AddProduct too ─
  useEffect(() => {
    if (storeUsername) fetchCategories(storeUsername);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUsername]);

  // ── Load products ────────────────────────────────────────────────────────────
  const loadPage = useCallback(async (page: number, catId: number | 'All', force = false) => {
    if (!storeUsername) return;
    setLoading(true);
    setFetchError(null); // clear any previous error before each attempt

    const result = await fetchPage({
      username: storeUsername,
      page,
      pageSize: PAGE_SIZE,
      ...(catId !== 'All' ? { category: [catId] as any } : {}),
    }, force);

    if (result) {
      // Success — even if products array is empty, this is NOT an error
      setProducts(result.products);
      setTotal(result.total);
      setHasMore(result.hasMore);
      // fetchError stays null — empty list will show the "No products found" empty state
    } else {
      // fetchPage returned null — means a real network/API error occurred
      const key = `${storeUsername}::${page}::${PAGE_SIZE}::${catId !== 'All' ? catId : ''}`;
      const knownError = cacheErrors[key];
      // Only surface an error if the store actually recorded one for this key.
      // Don't fall back to a generic message for an empty-but-successful response.
      if (knownError) {
        setFetchError(knownError);
      }
      // If no knownError, leave fetchError as null — empty state UI handles it
    }

    setLoading(false);
  }, [storeUsername, fetchPage, cacheErrors]);

  useEffect(() => {
    if (storeUsername && !isVerifying) loadPage(currentPage, filterCatId);
  }, [storeUsername, currentPage, filterCatId, isVerifying, loadPage]);

  const switchStore = (store: Store) => {
    setActiveStore(store);
    setStoreDropdown(false);
    setCurrentPage(1);
    setFilterCatId('All');
    setFilterStatus('All');
    setSearch('');
    setSelectedIds([]);
    setProducts([]);
    setFetchError(null);
  };

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || getStatus(p) === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock')      return b.stockCount - a.stockCount;
      return a.name.localeCompare(b.name);
    });

  const stats = [
    { label: 'Total',        value: total,                                                        icon: '📦', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
    { label: 'Active',       value: products.filter(p => getStatus(p) === 'Active').length,       icon: '✅', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20'  },
    { label: 'Low Stock',    value: products.filter(p => getStatus(p) === 'Low Stock').length,    icon: '⚠️', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: 'Out of Stock', value: products.filter(p => getStatus(p) === 'Out of Stock').length, icon: '❌', color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20'    },
  ];

  const totalPages   = Math.ceil(total / PAGE_SIZE);
  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openDialog = () => {
    setForm(emptyForm()); setTagsInput(''); setImagesInput('');
    setFormError(null); setActiveTab('basic'); setShowDialog(true);
  };

  const handleNameChange = (name: string) =>
    setForm(prev => ({ ...prev, name, slug: prev.slug === '' || prev.slug === autoSlug(prev.name) ? autoSlug(name) : prev.slug }));

  const handleSave = async () => {
    if (!form.name.trim())           { setActiveTab('basic');   setFormError('Product name is required.'); return; }
    if (!form.slug.trim())           { setActiveTab('basic');   setFormError('Slug is required.');         return; }
    if (form.categoryIds.length === 0){ setActiveTab('basic');  setFormError('Select at least one category.'); return; }
    if (form.price <= 0)             { setActiveTab('pricing'); setFormError('Price must be > 0.');        return; }

    setSaving(true); setFormError(null);
    try {
      await createProduct(storeUsername, {
        ...form,
        tags:   tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        images: imagesInput.split(',').map(i => i.trim()).filter(Boolean),
      });
      invalidate(storeUsername);
      setShowDialog(false);
      loadPage(currentPage, filterCatId, true);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(storeUsername, deleteTarget.slug);
      invalidate(storeUsername);
      setDeleteTarget(null);
      loadPage(currentPage, filterCatId, true);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to delete product.');
    } finally { setDeleting(false); }
  };

  if (isVerifying) {
    return <div className="flex items-center justify-center h-screen dark:bg-slate-900"><p className="text-gray-500 dark:text-slate-400 text-sm">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-5 md:p-7">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          {stores.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Loading store...</p>}
          {stores.length === 1 && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">@{activeStore?.username}</p>}
          {stores.length > 1 && (
            <div className="relative mt-1.5">
              <button onClick={() => setStoreDropdown(v => !v)} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
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
                      <button key={store.id} onClick={() => switchStore(store)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${activeStore?.id === store.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
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
        <div className="flex gap-2">
          <button onClick={() => navigate('/products/categories')} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">🏷️ Categories</button>
          <button onClick={openDialog} disabled={!storeUsername} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">+ Add Product</button>
        </div>
      </div>

      {/* Error Banner — only shown for real API errors, never for empty results */}
      {fetchError && !loading && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <span>⚠️ {fetchError}</span>
          <button onClick={() => loadPage(currentPage, filterCatId, true)} className="ml-4 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center text-sm`}>{s.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>
              {loading ? <span className="inline-block w-8 h-6 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or slug..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-colors dark:placeholder:text-slate-500" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {['All', 'Active', 'Low Stock', 'Out of Stock'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s}
            </button>
          ))}
          {/* Category filter — uses real IDs, shows names */}
          <select
            value={filterCatId === 'All' ? '' : String(filterCatId)}
            onChange={e => { setFilterCatId(e.target.value === '' ? 'All' : Number(e.target.value)); setCurrentPage(1); setSelectedIds([]); }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
            <option value="">All Categories</option>
            {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="stock">Stock ↓</option>
          </select>
          <div className="flex gap-1 ml-auto sm:ml-0">
            {(['table', 'grid'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${viewMode === mode ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                {mode === 'table' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-800 text-white rounded-xl px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button className="bg-red-400/40 text-white text-sm px-3 py-1.5 rounded-lg">Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-white text-xl">×</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-50 dark:border-slate-700 last:border-0 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-48" /><div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded w-24" /></div>
              <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-16" />
              <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-20" />
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && !fetchError && viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-3 pl-4 w-10"><input type="checkbox" className="rounded" onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} /></th>
                  {['Product', 'Slug', 'Categories', 'Price', 'Stock', 'Featured', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map(p => {
                  const status   = getStatus(p);
                  const catNames = resolveCategoryNames(p.categoryIds ?? []);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="py-3 pl-4"><input type="checkbox" className="rounded" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-lg">📦</span>}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{p.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">₹{p.compareAtPrice?.toLocaleString()} MRP</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.slug}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg max-w-[140px] truncate block" title={catNames}>{catNames}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">₹{p.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-semibold ${p.stockCount === 0 ? 'text-red-500' : p.stockCount <= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {p.stockCount}
                          {p.stockCount > 0 && p.stockCount <= 10 && <span className="text-[10px] text-red-500 ml-1 font-bold">LOW</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.isFeatured ? <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">⭐ Yes</span> : <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyle[status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => setDeleteTarget({ slug: p.slug, name: p.name })} className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Empty state — shown when fetch succeeded but list is empty */}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No products found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting filters or add your first product</p>
              <button onClick={openDialog} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">+ Add Product</button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400">Showing {filtered.length} of {total} products</span>
            <div className="flex gap-1.5 items-center">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 h-8 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => { if (i > 0 && n - (arr[i-1] as number) > 1) acc.push('...'); acc.push(n); return acc; }, [])
                .map((n, i) => n === '...'
                  ? <span key={`e${i}`} className="w-8 text-center text-slate-400 dark:text-slate-500">…</span>
                  : <button key={n} onClick={() => setCurrentPage(n as number)} className={`w-8 h-8 rounded-lg text-sm border transition-colors ${currentPage === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{n}</button>
                )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore} className="px-3 h-8 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">→</button>
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && !fetchError && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const status   = getStatus(p);
            const catNames = resolveCategoryNames(p.categoryIds ?? []);
            return (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center mb-4">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-4xl">📦</span>}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 flex-1">{p.name}</p>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusStyle[status]}`}>{status}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 truncate">{p.slug}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate" title={catNames}>🏷️ {catNames}</p>
                {p.isFeatured && <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">⭐ Featured</span>}
                <div className="flex items-center justify-between mt-3 mb-4">
                  <div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{p.price.toLocaleString()}</span>
                    {p.compareAtPrice > p.price && <span className="text-xs text-slate-400 dark:text-slate-500 line-through ml-1.5">₹{p.compareAtPrice.toLocaleString()}</span>}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Stock: <span className={p.stockCount <= 10 ? 'text-red-500 font-bold' : ''}>{p.stockCount}</span></span>
                </div>
                <button onClick={() => setDeleteTarget({ slug: p.slug, name: p.name })} className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm font-semibold py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Delete</button>
              </div>
            );
          })}
          {/* Empty state for grid */}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No products found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting filters or add your first product</p>
              <button onClick={openDialog} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">+ Add Product</button>
            </div>
          )}
        </div>
      )}

      {/* ADD PRODUCT DIALOG */}
      {showDialog && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Product</h2><p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Adding to @{storeUsername}</p></div>
              <button onClick={() => setShowDialog(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-lg leading-none">×</button>
            </div>
            <div className="flex shrink-0 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
              {([{ id: 'basic', label: '📝 Basic', desc: 'Name, slug, category' }, { id: 'pricing', label: '💰 Pricing', desc: 'Price, MRP' }, { id: 'inventory', label: '📦 Inventory', desc: 'Stock' }] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 px-2 text-center transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 bg-white dark:bg-slate-800 text-blue-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">{tab.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Product Name <span className="text-red-500">*</span></label>
                    <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Wireless Earbuds Pro" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Slug <span className="text-red-500">*</span></label>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="wireless-earbuds-pro" className={`${inp} font-mono text-blue-600 dark:text-blue-400`} />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Auto-generated · must be unique</p>
                  </div>
                  <CategorySelector
                    storeUsername={storeUsername}
                    selectedIds={form.categoryIds}
                    onChange={ids => setForm(f => ({ ...f, categoryIds: ids }))}
                    allowCreate
                    required
                  />
                  <div>
                    <label className={lbl}>Tags <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(comma separated)</span></label>
                    <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="wireless, earbuds" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your product..." rows={3} className={`${inp} resize-none leading-relaxed`} />
                  </div>
                  <div>
                    <label className={lbl}>Main Image URL</label>
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Additional Images <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(comma separated)</span></label>
                    <input value={imagesInput} onChange={e => setImagesInput(e.target.value)} placeholder="https://img1.com, https://img2.com" className={inp} />
                  </div>
                </div>
              )}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Selling Price <span className="text-red-500">*</span></label>
                      <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span><input type="number" min="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0.00" className={`${inp} pl-7`} /></div>
                    </div>
                    <div>
                      <label className={lbl}>MRP / Compare At</label>
                      <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span><input type="number" min="0" value={form.compareAtPrice || ''} onChange={e => setForm(f => ({ ...f, compareAtPrice: Number(e.target.value) }))} placeholder="0.00" className={`${inp} pl-7`} /></div>
                    </div>
                  </div>
                  {form.compareAtPrice > form.price && form.price > 0 && (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <span className="text-2xl">🎉</span>
                      <div><p className="text-sm font-bold text-green-700 dark:text-green-400">{Math.round((1 - form.price / form.compareAtPrice) * 100)}% OFF</p><p className="text-xs text-slate-500 dark:text-slate-400">Customers save ₹{(form.compareAtPrice - form.price).toLocaleString()}</p></div>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inp}>
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="USD">USD ($) — US Dollar</option>
                    </select>
                  </div>
                </div>
              )}
              {activeTab === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Stock Count <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={form.stockCount || ''} onChange={e => setForm(f => ({ ...f, stockCount: Number(e.target.value) }))} placeholder="0" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Availability</label>
                      <select value={form.inStock ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, inStock: e.target.value === 'true' }))} className={inp}>
                        <option value="true">✅ In Stock</option>
                        <option value="false">❌ Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div className={`rounded-xl p-4 border ${!form.inStock || form.stockCount === 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : form.stockCount <= 10 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Preview</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{!form.inStock || form.stockCount === 0 ? '❌ Out of Stock' : form.stockCount <= 10 ? '⚠️ Low Stock' : '✅ Active'}</p>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div className="mx-6 mb-0 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm shrink-0 flex items-center justify-between">
                <span>⚠️ {formError}</span>
                <button onClick={() => setFormError(null)} className="ml-2 text-lg leading-none text-red-400 hover:text-red-600">×</button>
              </div>
            )}

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800 rounded-b-2xl">
              <div className="flex gap-2 mr-auto">
                {activeTab !== 'basic'     && <button onClick={() => setActiveTab(activeTab === 'inventory' ? 'pricing' : 'basic')} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">← Back</button>}
                {activeTab !== 'inventory' && <button onClick={() => setActiveTab(activeTab === 'basic' ? 'pricing' : 'inventory')} className="px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 transition-colors">Next →</button>}
              </div>
              <button onClick={() => setShowDialog(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : '🚀 Add Product'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-4xl text-center mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Delete Product?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">You are about to delete:</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center mb-6">"{deleteTarget.name}"</p>
            <p className="text-xs text-red-500 dark:text-red-400 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {deleting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}