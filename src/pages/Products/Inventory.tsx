// src/pages/Products/Inventory.tsx

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useProductStore } from '../../store/useProductStore';
import { useAuth } from '../../hooks/useAuth';
import type { Product, Store } from '../../types/store';

type InventoryItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl: string;
  stock: number;
  available: number;
  inStock: boolean;
  reorderPoint: number;
  price: number;
};

const REORDER_POINT = 10;
const PAGE_SIZE     = 50;

const toInventoryItem = (p: Product): InventoryItem => ({
  id:           p.id,
  name:         p.name,
  slug:         p.slug,
  category:     p.category ?? '—',
  imageUrl:     p.imageUrl ?? '',
  stock:        p.stockCount,
  available:    p.stockCount,
  inStock:      p.inStock,
  reorderPoint: REORDER_POINT,
  price:        p.price,
});

const getStatus = (stock: number, inStock: boolean, reorder: number) => {
  if (!inStock || stock === 0)
    return { label: 'Out of Stock', badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',          dot: 'bg-red-500'    };
  if (stock <= reorder)
    return { label: 'Low Stock',    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' };
  return   { label: 'In Stock',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    dot: 'bg-green-500'  };
};

export default function Inventory() {
  const navigate = useNavigate();

  const { isVerifying } = useAuth();

  const { stores, activeStore, setActiveStore } = useAppStore();
  const { fetchPage, errors: cacheErrors }      = useProductStore();

  const storeUsername = activeStore?.username ?? '';

  const [items, setItems]                 = useState<InventoryItem[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [storeDropdown, setStoreDropdown] = useState(false);

  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus]     = useState('All');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockEdit, setStockEdit] = useState('');

  const fetchInventory = useCallback(async (force = false) => {
    if (!storeUsername) return;
    setLoading(true);
    setError(null);
  
    const result = await fetchPage(
      { username: storeUsername, page: 1, pageSize: PAGE_SIZE },
      force
    );
  
    if (result) {
      setItems(result.products.map(toInventoryItem));
      setError(null);
    } else {
      const k = `${storeUsername}::1::${PAGE_SIZE}::`;
      setError(cacheErrors[k] || 'Failed to load inventory.');
    }
    setLoading(false);
  }, [storeUsername, fetchPage, cacheErrors]);

  useEffect(() => {
    if (storeUsername && !isVerifying) fetchInventory();
  }, [storeUsername, isVerifying, fetchInventory]);

  const switchStore = (store: Store) => {
    setActiveStore(store);
    setStoreDropdown(false);
    setFilterCategory('All');
    setFilterStatus('All');
    setSearch('');
    setItems([]);
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category).filter(c => c && c !== '—')))];

  const filtered = items.filter(item => {
    const q           = search.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    const matchCat    = filterCategory === 'All' || item.category === filterCategory;
    const status      = getStatus(item.stock, item.inStock, item.reorderPoint).label;
    const matchStatus = filterStatus === 'All' || status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalStock  = items.reduce((s, i) => s + i.stock, 0);
  const lowCount    = items.filter(i => i.stock > 0 && i.inStock && i.stock <= i.reorderPoint).length;
  const outCount    = items.filter(i => !i.inStock || i.stock === 0).length;
  const activeCount = items.filter(i => i.inStock && i.stock > i.reorderPoint).length;

  const saveStock = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, stock: Number(stockEdit), available: Number(stockEdit), inStock: Number(stockEdit) > 0 }
          : item
      )
    );
    setEditingId(null);
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-slate-900">
        <p className="text-gray-500 dark:text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

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
              <button
                onClick={() => setStoreDropdown(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {activeStore?.logoUrl && (
                  <img src={activeStore.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
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
                          {store.logoUrl
                            ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="text-base">🏪</span>}
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
          <button onClick={() => fetchInventory(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/products/add')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
            + Add Product
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <span>⚠️ {error}</span>
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
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors
                ${filterStatus === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
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
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-48" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded w-24" />
                </div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-16" />
                <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  {['Product', 'Slug', 'Category', 'Price', 'Stock', 'Available', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map(item => {
                  const status    = getStatus(item.stock, item.inStock, item.reorderPoint);
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <span className="text-lg">📦</span>}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.slug}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">{item.category}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200">₹{item.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input value={stockEdit} onChange={e => setStockEdit(e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none" autoFocus />
                            <button onClick={() => saveStock(item.id)} className="bg-blue-600 text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">✓</button>
                            <button onClick={() => setEditingId(null)} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">✕</button>
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${item.stock === 0 ? 'text-red-500' : item.stock <= item.reorderPoint ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.stock}
                            {item.stock > 0 && item.stock <= item.reorderPoint && (
                              <span className="text-[10px] text-red-500 ml-1 font-bold">LOW</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold ${item.available <= 5 && item.available > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.available}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${status.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditingId(item.id); setStockEdit(String(item.stock)); }}
                            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap">
                            Update
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

            {filtered.length === 0 && !loading && (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-base font-semibold text-slate-500 dark:text-slate-400">No products found</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}

        {!loading && (lowCount > 0 || outCount > 0) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <span className="text-lg shrink-0">⚠️</span>
            <span className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
              {outCount > 0 && `${outCount} item${outCount > 1 ? 's' : ''} out of stock`}
              {outCount > 0 && lowCount > 0 && ' · '}
              {lowCount > 0 && `${lowCount} item${lowCount > 1 ? 's' : ''} running low`}
              . Consider restocking soon.
            </span>
            <button onClick={() => setFilterStatus('Low Stock')}
              className="sm:ml-auto shrink-0 bg-yellow-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap">
              View Low Stock →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}