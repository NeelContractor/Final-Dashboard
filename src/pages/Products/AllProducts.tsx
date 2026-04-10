// src/pages/Products/AllProducts.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, createProduct, deleteProduct } from '../../services/productService';
import { tokenStorage } from '../../utils/tokenStorage';
import { userDetails } from '../../services/userService';
import type { Product, CreateProductRequestBody } from '../../types/store';

// ─── Status helpers ────────────────────────────────────────────────────────────
const getStatus = (p: Product) => {
  if (!p.inStock || p.stockCount === 0) return 'Out of Stock';
  if (p.stockCount <= 10) return 'Low Stock';
  return 'Active';
};

const statusStyle: Record<string, string> = {
  'Active':       'bg-green-100 text-green-700',
  'Low Stock':    'bg-yellow-100 text-yellow-700',
  'Out of Stock': 'bg-red-100 text-red-600',
};
const statusDot: Record<string, string> = {
  'Active':       'bg-green-500',
  'Low Stock':    'bg-yellow-500',
  'Out of Stock': 'bg-red-500',
};

// ─── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = (): CreateProductRequestBody => ({
  name: '', description: '', price: 0, compareAtPrice: 0,
  currency: 'INR', imageUrl: '', images: [], category: '',
  inStock: true, stockCount: 0, isFeatured: false, tags: [], slug: '',
});

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AllProducts() {
  // Store username from auth
  const [storeUsername, setStoreUsername] = useState<string>('');

  // Product data
  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // UI state
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy]       = useState('name');
  const [viewMode, setViewMode]   = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add product dialog
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm]             = useState<CreateProductRequestBody>(emptyForm());
  const [tagsInput, setTagsInput]   = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'basic' | 'pricing' | 'inventory'>('basic');

  // Delete confirm
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // Get store username on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await userDetails();
        const username = res?.data?.stores?.[0]?.username;
        if (username) setStoreUsername(username);
        else setError('No store found. Please create a store first.');
      } catch {
        setError('Failed to load store info.');
      }
    };
    init();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (page: number) => {
    if (!storeUsername) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(storeUsername, {
        page,
        pageSize: PAGE_SIZE,
        ...(filterCategory !== 'All' ? { category: filterCategory } : {}),
      });
      // Handle both { data: { products, meta } } and { products, meta } shapes
      const payload = res?.data ?? res as any;
      setProducts(payload?.products ?? []);
      setTotal(payload?.meta?.total ?? 0);
      setHasMore(payload?.meta?.hasMore ?? false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [storeUsername, filterCategory]);

  useEffect(() => {
    if (storeUsername) fetchProducts(currentPage);
  }, [storeUsername, currentPage, fetchProducts]);

  // Client-side filter + sort
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      const status = getStatus(p);
      const matchStatus = filterStatus === 'All' || status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock')      return b.stockCount - a.stockCount;
      return a.name.localeCompare(b.name);
    });

  const stats = [
    { label: 'Total',        value: total,                                                                icon: '📦', color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Active',       value: products.filter(p => getStatus(p) === 'Active').length,              icon: '✅', color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Low Stock',    value: products.filter(p => getStatus(p) === 'Low Stock').length,           icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Out of Stock', value: products.filter(p => getStatus(p) === 'Out of Stock').length,        icon: '❌', color: 'text-red-600',    bg: 'bg-red-50'    },
  ];

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Add product ──────────────────────────────────────────────────────────────
  const openDialog = () => {
    setForm(emptyForm());
    setTagsInput('');
    setImagesInput('');
    setFormError(null);
    setActiveTab('basic');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())  return setFormError('Product name is required.');
    if (!form.slug.trim())  return setFormError('Slug is required.');
    if (form.price <= 0)    return setFormError('Price must be greater than 0.');

    setSaving(true);
    setFormError(null);
    try {
      const payload: CreateProductRequestBody = {
        ...form,
        tags:   tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        images: imagesInput.split(',').map(i => i.trim()).filter(Boolean),
      };
      await createProduct(storeUsername, payload);
      setShowDialog(false);
      fetchProducts(currentPage);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete product ───────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteSlug) return;
    setDeleting(true);
    try {
      await deleteProduct({ username: storeUsername, slug: deleteSlug });
      setDeleteSlug(null);
      fetchProducts(currentPage);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Input helper ─────────────────────────────────────────────────────────────
  const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5";

  // ── Slug auto-generate from name ─────────────────────────────────────────────
  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === autoSlug(prev.name)
        ? autoSlug(name)
        : prev.slug,
    }));
  };
  const autoSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {storeUsername ? `@${storeUsername}` : 'Loading store...'}
          </p>
        </div>
        <button
          onClick={openDialog}
          disabled={!storeUsername}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Product
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => fetchProducts(currentPage)} className="ml-4 text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center text-sm`}>{s.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>
              {loading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or slug..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Status filter pills */}
          {['All', 'Active', 'Low Stock', 'Out of Stock'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}

          {/* Category */}
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none cursor-pointer">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none cursor-pointer">
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="stock">Stock ↓</option>
          </select>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto sm:ml-0">
            {(['table', 'grid'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${viewMode === mode ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                {mode === 'table' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bulk Bar ── */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-800 text-white rounded-xl px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <button className="bg-red-400/40 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-400/50 transition-colors">Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-white text-xl">×</button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-50 last:border-0 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded w-48" />
                <div className="h-2.5 bg-slate-100 rounded w-24" />
              </div>
              <div className="h-3.5 bg-slate-100 rounded w-16" />
              <div className="h-6 bg-slate-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 pl-4 w-10">
                    <input type="checkbox" className="rounded"
                      onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} />
                  </th>
                  {['Product', 'Slug', 'Category', 'Price', 'Stock', 'Featured', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 pl-4">
                        <input type="checkbox" className="rounded" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <span className="text-lg">📦</span>}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{p.name}</p>
                            <p className="text-xs text-slate-400">₹{p.compareAtPrice?.toLocaleString()} MRP</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">{p.slug}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{p.category || '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900">₹{p.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-semibold ${p.stockCount === 0 ? 'text-red-500' : p.stockCount <= 10 ? 'text-yellow-600' : 'text-slate-800'}`}>
                          {p.stockCount}
                          {p.stockCount > 0 && p.stockCount <= 10 && <span className="text-[10px] text-red-500 ml-1 font-bold">LOW</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.isFeatured
                          ? <span className="text-[11px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">⭐ Yes</span>
                          : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyle[status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setDeleteSlug(p.slug)}
                            className="bg-red-50 text-red-500 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-base font-semibold text-slate-500">No products found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting filters or add your first product</p>
              <button onClick={openDialog} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                + Add Product
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {filtered.length} of {total} products
            </span>
            <div className="flex gap-1.5 items-center">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 h-8 rounded-lg text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="w-8 text-center text-slate-400">…</span>
                    : <button key={n} onClick={() => setCurrentPage(n as number)}
                        className={`w-8 h-8 rounded-lg text-sm border transition-colors ${currentPage === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{n}</button>
                )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={!hasMore}
                className="px-3 h-8 rounded-lg text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">→</button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const status = getStatus(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center mb-4">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span className="text-4xl">📦</span>}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900 line-clamp-2 flex-1">{p.name}</p>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusStyle[status]}`}>{status}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{p.slug} · {p.category || 'No category'}</p>
                {p.isFeatured && <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">⭐ Featured</span>}
                <div className="flex items-center justify-between mt-3 mb-4">
                  <div>
                    <span className="text-lg font-bold text-blue-600">₹{p.price.toLocaleString()}</span>
                    {p.compareAtPrice > p.price && (
                      <span className="text-xs text-slate-400 line-through ml-1.5">₹{p.compareAtPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">Stock: <span className={p.stockCount <= 10 ? 'text-red-500 font-bold' : ''}>{p.stockCount}</span></span>
                </div>
                <button onClick={() => setDeleteSlug(p.slug)}
                  className="w-full bg-red-50 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-base font-semibold text-slate-500">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ADD PRODUCT DIALOG ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Product</h2>
              <button onClick={() => setShowDialog(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-3 bg-slate-50 border-b border-slate-100">
              {(['basic', 'pricing', 'inventory'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === 'basic' ? '📝 Basic' : tab === 'pricing' ? '💰 Pricing' : '📦 Inventory'}
                </button>
              ))}
            </div>

            {/* Form content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* ── Basic Tab ── */}
              {activeTab === 'basic' && (
                <>
                  <div>
                    <label className={lbl}>Product Name *</label>
                    <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Wireless Earbuds Pro" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Slug *</label>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. wireless-earbuds-pro" className={`${inp} font-mono`} />
                    <p className="text-xs text-slate-400 mt-1">Auto-generated from name. Must be unique.</p>
                  </div>
                  <div>
                    <label className={lbl}>Category</label>
                    <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your product..." rows={4} className={`${inp} resize-none leading-relaxed`} />
                  </div>
                  <div>
                    <label className={lbl}>Main Image URL</label>
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Additional Image URLs <span className="text-slate-400 font-normal">(comma separated)</span></label>
                    <input value={imagesInput} onChange={e => setImagesInput(e.target.value)} placeholder="https://img1.com, https://img2.com" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
                    <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="wireless, earbuds, bluetooth" className={inp} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                      className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    <label htmlFor="featured" className="text-sm font-medium text-slate-700 cursor-pointer">⭐ Mark as Featured</label>
                  </div>
                </>
              )}

              {/* ── Pricing Tab ── */}
              {activeTab === 'pricing' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Selling Price (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                        <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                          placeholder="0.00" className={`${inp} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>MRP / Compare At (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                        <input type="number" value={form.compareAtPrice || ''} onChange={e => setForm(f => ({ ...f, compareAtPrice: Number(e.target.value) }))}
                          placeholder="0.00" className={`${inp} pl-7`} />
                      </div>
                    </div>
                  </div>
                  {form.compareAtPrice > form.price && form.price > 0 && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="text-base font-bold text-green-700">
                          {Math.round((1 - form.price / form.compareAtPrice) * 100)}% OFF
                        </p>
                        <p className="text-xs text-slate-500">Customers save ₹{(form.compareAtPrice - form.price).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inp}>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </>
              )}

              {/* ── Inventory Tab ── */}
              {activeTab === 'inventory' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Stock Count *</label>
                      <input type="number" value={form.stockCount || ''} onChange={e => setForm(f => ({ ...f, stockCount: Number(e.target.value) }))}
                        placeholder="0" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>In Stock</label>
                      <select value={form.inStock ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, inStock: e.target.value === 'true' }))} className={inp}>
                        <option value="true">Yes — Available</option>
                        <option value="false">No — Unavailable</option>
                      </select>
                    </div>
                  </div>
                  <div className={`rounded-xl p-4 border ${form.stockCount === 0 ? 'bg-red-50 border-red-200' : form.stockCount <= 10 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <p className="text-sm font-semibold text-slate-700">
                      {form.stockCount === 0 ? '❌ Will be Out of Stock' : form.stockCount <= 10 ? '⚠️ Will be Low Stock' : '✅ Will be Active'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mx-6 mb-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                ⚠️ {formError}
              </div>
            )}

            {/* Dialog Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {saving ? '⏳ Saving...' : '🚀 Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteSlug && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-4xl text-center mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Product?</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete <span className="font-mono font-semibold text-slate-700">{deleteSlug}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSlug(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const products = [
//   { id: 1,  emoji: '🎧', name: 'Wireless Earbuds Pro',    sku: 'WEP-001', category: 'Electronics',    price: 2499, stock: 142, status: 'Active',       sales: 320, rating: 4.5 },
//   { id: 2,  emoji: '👕', name: 'Cotton Polo Shirt',       sku: 'CPS-112', category: 'Clothing',       price: 799,  stock: 7,   status: 'Low Stock',    sales: 89,  rating: 4.2 },
//   { id: 3,  emoji: '🍳', name: 'Non-Stick Kadai 28cm',    sku: 'NSK-028', category: 'Home & Kitchen', price: 1299, stock: 58,  status: 'Active',       sales: 210, rating: 4.7 },
//   { id: 4,  emoji: '🖥️', name: 'USB-C Hub 7-in-1',       sku: 'UCH-071', category: 'Electronics',    price: 1899, stock: 0,   status: 'Out of Stock', sales: 145, rating: 4.3 },
//   { id: 5,  emoji: '📗', name: 'Clean Code Book',         sku: 'CCB-003', category: 'Books',          price: 549,  stock: 200, status: 'Active',       sales: 430, rating: 4.8 },
//   { id: 6,  emoji: '⌚', name: 'Smart Watch Series 5',    sku: 'SWS-005', category: 'Electronics',    price: 4999, stock: 34,  status: 'Active',       sales: 178, rating: 4.6 },
//   { id: 7,  emoji: '🎒', name: 'Laptop Backpack 30L',     sku: 'LBP-030', category: 'Clothing',       price: 1599, stock: 3,   status: 'Low Stock',    sales: 67,  rating: 4.1 },
//   { id: 8,  emoji: '💡', name: 'Smart LED Bulb',          sku: 'SLB-010', category: 'Home & Kitchen', price: 399,  stock: 89,  status: 'Active',       sales: 560, rating: 4.4 },
//   { id: 9,  emoji: '📘', name: 'Atomic Habits',           sku: 'AH-001',  category: 'Books',          price: 449,  stock: 150, status: 'Active',       sales: 720, rating: 4.9 },
//   { id: 10, emoji: '🎮', name: 'Wireless Gamepad',        sku: 'WGP-004', category: 'Electronics',    price: 2199, stock: 0,   status: 'Out of Stock', sales: 98,  rating: 4.0 },
//   { id: 11, emoji: '🧴', name: 'Vitamin C Serum',         sku: 'VCS-021', category: 'Beauty',         price: 899,  stock: 45,  status: 'Active',       sales: 380, rating: 4.6 },
//   { id: 12, emoji: '🏃', name: 'Running Shoes X2',        sku: 'RSX-002', category: 'Clothing',       price: 3299, stock: 12,  status: 'Active',       sales: 155, rating: 4.3 },
// ];

// const statusStyle: Record<string, string> = {
//   'Active':       'bg-green-100 text-green-700',
//   'Low Stock':    'bg-yellow-100 text-yellow-700',
//   'Out of Stock': 'bg-red-100 text-red-600',
//   'Draft':        'bg-blue-100 text-blue-700',
// };
// const statusDot: Record<string, string> = {
//   'Active':       'bg-green-500',
//   'Low Stock':    'bg-yellow-500',
//   'Out of Stock': 'bg-red-500',
//   'Draft':        'bg-blue-500',
// };

// const categories = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty'];

// export default function AllProducts() {
//   const navigate = useNavigate();
//   const [search, setSearch]               = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [selectedStatus, setSelectedStatus]     = useState('All');
//   const [sortBy, setSortBy]               = useState('name');
//   const [viewMode, setViewMode]           = useState<'table' | 'grid'>('table');
//   const [selectedIds, setSelectedIds]     = useState<number[]>([]);

//   const filtered = products
//     .filter(p => {
//       const q = search.toLowerCase();
//       return (
//         (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
//         (selectedCategory === 'All' || p.category === selectedCategory) &&
//         (selectedStatus   === 'All' || p.status   === selectedStatus)
//       );
//     })
//     .sort((a, b) => {
//       if (sortBy === 'price') return b.price - a.price;
//       if (sortBy === 'stock') return b.stock - a.stock;
//       if (sortBy === 'sales') return b.sales - a.sales;
//       return a.name.localeCompare(b.name);
//     });

//   const toggleSelect = (id: number) =>
//     setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

//   const stats = [
//     { label: 'Total Products', value: products.length,                                    icon: '📦', color: 'text-blue-600',  bg: 'bg-blue-50'  },
//     { label: 'Active',         value: products.filter(p => p.status === 'Active').length, icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
//     { label: 'Low Stock',      value: products.filter(p => p.status === 'Low Stock').length, icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50' },
//     { label: 'Out of Stock',   value: products.filter(p => p.status === 'Out of Stock').length, icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-7">

//       {/* ── Header ── */}
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900">All Products</h1>
//           <p className="text-sm text-slate-500 mt-0.5">Manage and track your entire product catalog</p>
//         </div>
//         <div className="flex gap-2 shrink-0">
//           <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
//             ⬇ Export
//           </button>
//           <button
//             onClick={() => navigate('/products/add')}
//             className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
//           >
//             + Add Product
//           </button>
//         </div>
//       </div>

//       {/* ── Stats ── */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
//         {stats.map(s => (
//           <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-xs text-slate-500 font-medium">{s.label}</span>
//               <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center text-base`}>{s.icon}</div>
//             </div>
//             <div className={`text-2xl sm:text-3xl font-bold ${s.color}`}>{s.value}</div>
//           </div>
//         ))}
//       </div>

//       {/* ── Filters ── */}
//       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
//         {/* Search */}
//         <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
//           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
//           <input
//             value={search} onChange={e => setSearch(e.target.value)}
//             placeholder="Search products or SKU..."
//             className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-colors"
//           />
//         </div>

//         {/* Selects row — scroll on very small screens */}
//         <div className="flex gap-2 flex-wrap">
//           <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
//             className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none cursor-pointer">
//             {categories.map(c => <option key={c}>{c}</option>)}
//           </select>

//           <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
//             className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none cursor-pointer">
//             {['All', 'Active', 'Low Stock', 'Out of Stock', 'Draft'].map(s => <option key={s}>{s}</option>)}
//           </select>

//           <select value={sortBy} onChange={e => setSortBy(e.target.value)}
//             className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none cursor-pointer">
//             <option value="name">Sort: Name</option>
//             <option value="price">Sort: Price</option>
//             <option value="stock">Sort: Stock</option>
//             <option value="sales">Sort: Sales</option>
//           </select>

//           {/* View toggle */}
//           <div className="flex gap-1 ml-auto sm:ml-0">
//             {(['table', 'grid'] as const).map(mode => (
//               <button key={mode} onClick={() => setViewMode(mode)}
//                 className={`px-3 py-2 rounded-xl border text-sm transition-colors ${viewMode === mode ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
//                 {mode === 'table' ? '☰' : '⊞'}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── Bulk Action Bar ── */}
//       {selectedIds.length > 0 && (
//         <div className="bg-blue-800 text-white rounded-xl px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
//           <span className="text-sm font-medium">{selectedIds.length} selected</span>
//           <button className="bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">Bulk Edit</button>
//           <button className="bg-red-400/40 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-400/50 transition-colors">Delete</button>
//           <button onClick={() => setSelectedIds([])} className="ml-auto bg-transparent border-none text-white text-xl cursor-pointer">×</button>
//         </div>
//       )}

//       {/* ── TABLE VIEW ── */}
//       {viewMode === 'table' && (
//         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[700px]">
//               <thead>
//                 <tr className="bg-slate-50 border-b border-slate-100">
//                   <th className="py-3 pl-4 w-10">
//                     <input type="checkbox" className="rounded"
//                       onChange={e => setSelectedIds(e.target.checked ? filtered.map(p => p.id) : [])} />
//                   </th>
//                   {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Sales', 'Status', 'Actions'].map(h => (
//                     <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {filtered.map(p => (
//                   <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50' : ''}`}>
//                     <td className="py-3 pl-4">
//                       <input type="checkbox" className="rounded" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">{p.emoji}</div>
//                         <div>
//                           <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{p.name}</p>
//                           <p className="text-xs text-slate-400">⭐ {p.rating}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4 text-xs font-mono font-semibold text-slate-500 whitespace-nowrap">{p.sku}</td>
//                     <td className="py-3 px-4">
//                       <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg whitespace-nowrap">{p.category}</span>
//                     </td>
//                     <td className="py-3 px-4 text-sm font-bold text-slate-900 whitespace-nowrap">₹{p.price.toLocaleString()}</td>
//                     <td className="py-3 px-4">
//                       <span className={`text-sm font-semibold whitespace-nowrap ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-yellow-600' : 'text-slate-800'}`}>
//                         {p.stock === 0 ? '—' : p.stock}
//                         {p.stock > 0 && p.stock <= 10 && <span className="text-[10px] text-red-500 ml-1 font-bold">LOW</span>}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4 text-sm text-slate-500">{p.sales}</td>
//                     <td className="py-3 px-4">
//                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusStyle[p.status]}`}>
//                         <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
//                         {p.status}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex gap-1.5">
//                         <button className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">Edit</button>
//                         <button className="bg-red-50 text-red-500 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">🗑</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Empty state */}
//           {filtered.length === 0 && (
//             <div className="py-16 text-center">
//               <div className="text-5xl mb-3">🔍</div>
//               <p className="text-base font-semibold text-slate-500">No products found</p>
//               <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
//             </div>
//           )}

//           {/* Pagination */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
//             <span className="text-sm text-slate-500">Showing {filtered.length} of {products.length} products</span>
//             <div className="flex gap-1.5">
//               {[1, 2, 3].map(n => (
//                 <button key={n} className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${n === 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
//                   {n}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── GRID VIEW ── */}
//       {viewMode === 'grid' && (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
//           {filtered.map(p => (
//             <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">{p.emoji}</div>
//                 <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyle[p.status]}`}>{p.status}</span>
//               </div>
//               <p className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{p.name}</p>
//               <p className="text-xs text-slate-400 mb-3">{p.sku} · {p.category}</p>
//               <div className="flex items-center justify-between mb-4">
//                 <span className="text-lg font-bold text-blue-600">₹{p.price.toLocaleString()}</span>
//                 <span className="text-xs text-slate-500">Stock: <span className={p.stock <= 5 ? 'text-red-500 font-bold' : ''}>{p.stock}</span></span>
//               </div>
//               <div className="flex gap-2">
//                 <button className="flex-1 bg-blue-50 text-blue-600 text-sm font-semibold py-2 rounded-xl hover:bg-blue-100 transition-colors">Edit</button>
//                 <button className="flex-1 bg-red-50 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-100 transition-colors">Delete</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }