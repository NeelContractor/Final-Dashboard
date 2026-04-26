// src/pages/Products/Categories.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Category } from '../../store/useCategoryStore';
import { useAuth } from '../../hooks/useAuth';
import {
  createCategories,
  updateCategories,
  activateCategories,
  deactivateCategories,
} from '../../services/productService';
import type { Store } from '../../types/store';
import CloudinaryUploadWidget from '../../ImageUpload';

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30 dark:placeholder:text-slate-500";
const lbl = "block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300";

// const UW_CONFIG: Record<string, unknown> = {
//   cloudName:            import.meta.env.VITE_CLOUD_NAME ?? '',
//   uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET ?? '',
//   multiple:             false,
//   clientAllowedFormats: ['image'],
// };

const autoSlug = (n: string) =>
  n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Form Dialog ───────────────────────────────────────────────────────────────

interface CategoryForm {
  name: string; 
  slug: string; 
  description: string;
  imageUrl: string; 
  parentId: number | null; 
  displayOrder: number;
}

interface CategoryDialogProps {
  mode: 'create' | 'edit';
  initial?: Category;
  defaultParentId?: number | null;
  parents: Category[];
  storeUsername: string;
  onSuccess: () => void;
  onClose: () => void;
}

function CategoryDialog({ mode, initial, defaultParentId = null, parents, storeUsername, onSuccess, onClose }: CategoryDialogProps) {
  const [form, setForm] = useState<CategoryForm>(
    initial
      ? { name: initial.name, slug: initial.slug, description: initial.description ?? '', imageUrl: initial.imageUrl ?? '', parentId: initial.parentId ?? null, displayOrder: initial.displayOrder ?? 0 }
      : { name: '', slug: '', description: '', imageUrl: '', parentId: defaultParentId, displayOrder: 0 }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const UW_CONFIG = useMemo(() => ({
    cloudName:            import.meta.env.VITE_CLOUD_NAME,
    uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET,
    multiple:             false,
    clientAllowedFormats: ['image'],
  }), []); // empty deps — env vars never change at runtime

  const handleNameChange = (name: string) =>
    setForm(prev => ({ ...prev, name, slug: prev.slug === '' || prev.slug === autoSlug(prev.name) ? autoSlug(name) : prev.slug }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.slug.trim()) { setError('Slug is required.'); return; }
    setSaving(true); setError(null);
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), imageUrl: form.imageUrl.trim(), parentId: form.parentId ?? 0, displayOrder: Number(form.displayOrder) || 0 };
      if (mode === 'create') await createCategories(storeUsername, body);
      else if (initial)      await updateCategories(initial.id, body);
      onSuccess();
    } catch (err: any) { setError(err?.message || `Failed to ${mode}.`); setSaving(false); }
  };

  const parentLabel = parents.find(p => p.id === form.parentId)?.name;

  const update = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = useCallback((url: string) => {
    setForm(prev => ({ ...prev, imageUrl: url }));
  }, []);

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? (form.parentId ? '↳ New Sub-category' : '🏷️ New Category') : '✏️ Edit Category'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {mode === 'create' ? (parentLabel ? `Child of "${parentLabel}"` : `Top-level · @${storeUsername}`) : `Editing "${initial?.name}"`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-lg leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="ml-2 text-lg leading-none text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          <div>
            <label className={lbl}>Parent Category <span className="text-slate-400 font-normal text-xs">(none = top-level)</span></label>
            <select value={form.parentId ?? ''} onChange={e => setForm(f => ({ ...f, parentId: e.target.value === '' ? null : Number(e.target.value) }))} className={inp}>
              <option value="">Root (top-level category)</option>
              {parents.filter(p => mode === 'edit' ? p.id !== initial?.id : true).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={lbl}>Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Clothing" className={inp} autoFocus />
          </div>

          <div>
            <label className={lbl}>Slug <span className="text-red-500">*</span></label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="clothing" className={`${inp} font-mono text-blue-600 dark:text-blue-400`} />
            <p className="text-[11px] text-slate-400 mt-1">Auto-generated · must be unique</p>
          </div>

          <div>
            <label className={lbl}>Description <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this category…" rows={3} className={`${inp} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Image URL <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
              {/* <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/cat.jpg" className={inp} /> */}
              <CloudinaryUploadWidget uwConfig={UW_CONFIG} onUpload={handleImageUpload} /> {/** TODO: after clicking upload image button screen freezes */}
                {form.imageUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    <img src={form.imageUrl} alt="Main preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => update('imageUrl', '')}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                    >✕</button>
                  </div>
                )}
            </div>
            <div>
              <label className={lbl}>Display Order</label>
              <input type="number" min="0" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} className={inp} />
            </div>
          </div>

          {form.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 h-28 bg-slate-50 dark:bg-slate-700">
              <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : mode === 'create' ? '🏷️ Create Category' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Toggle Confirm ────────────────────────────────────────────────────────────

function ToggleConfirmDialog({ type, category, onConfirm, onCancel, loading }: { type: 'activate' | 'deactivate'; category: Category; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const isActivate = type === 'activate';
  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="text-4xl text-center mb-3">{isActivate ? '✅' : '⏸️'}</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">{isActivate ? 'Activate' : 'Deactivate'} Category?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">You are about to {type}:</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">"{category.name}"</p>
        {!isActivate && <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-3 py-2">Products in this category remain visible but won't appear in filters.</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${isActivate ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Working…</> : isActivate ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Category Row (recursive) ─────────────────────────────────────────────────

function CategoryRow({ cat, children, onEdit, onToggle, onAddChild, depth = 0 }: {
  cat: Category; children: Category[];
  onEdit: (c: Category) => void;
  onToggle: (c: Category, t: 'activate' | 'deactivate') => void;
  onAddChild: (parentId: number) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive    = cat.active !== false;
  const hasChildren = children.length > 0;

  return (
    <>
      <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5" style={{ paddingLeft: depth * 20 }}>
            {depth === 0 ? (
              <button onClick={() => setExpanded(v => !v)} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 transition-colors ${hasChildren ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600' : 'invisible'}`}>
                {expanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="text-slate-300 dark:text-slate-600 text-xs shrink-0">↳</span>
            )}
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
              {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-sm">{depth === 0 ? '🏷️' : '📂'}</span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">ID {cat.id}{depth > 0 ? ` · child of ${cat.parentId}` : ''}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{cat.slug}</td>
        <td className="py-3 px-4"><p className="text-xs text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{cat.description || <span className="text-slate-300 dark:text-slate-600">—</span>}</p></td>
        <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{cat.displayOrder ?? 0}</td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => onEdit(cat)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">✏️ Edit</button>
            {depth === 0 && <button onClick={() => onAddChild(cat.id)} className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">+ Sub</button>}
            {isActive
              ? <button onClick={() => onToggle(cat, 'deactivate')} className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors">⏸️ Disable</button>
              : <button onClick={() => onToggle(cat, 'activate')}   className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors">▶️ Enable</button>}
          </div>
        </td>
      </tr>
      {expanded && children.map(child => (
        <CategoryRow key={child.id} cat={child} children={[]} onEdit={onEdit} onToggle={onToggle} onAddChild={onAddChild} depth={1} />
      ))}
    </>
  );
}

// ─── Store Switcher (reused snippet) ─────────────────────────────────────────

function StoreSwitcher({ stores, activeStore, setActiveStore, onSwitch }: { stores: Store[]; activeStore: Store | null; setActiveStore: (s: Store) => void; onSwitch: () => void }) {
  const [open, setOpen] = useState(false);
  if (stores.length <= 1) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeStore ? `@${activeStore.username}` : 'Loading…'}</p>;
  }
  return (
    <div className="relative mt-1.5">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
        {activeStore?.logoUrl && <img src={activeStore.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
        <span className="text-slate-500 dark:text-slate-400">@{activeStore?.username}</span>
        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-md px-1.5 py-0.5 font-semibold">{stores.length} stores</span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-[101] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl py-1.5 min-w-[240px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-2 pb-1">Switch Store</p>
            {stores.map(store => (
              <button key={store.id} onClick={() => { setActiveStore(store); setOpen(false); onSwitch(); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${activeStore?.id === store.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {store.logoUrl ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-base">🏪</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${activeStore?.id === store.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{store.name}</p>
                  <p className="text-xs text-slate-400 truncate">@{store.username}</p>
                </div>
                {activeStore?.id === store.id && <span className="text-blue-600 text-xs font-bold shrink-0">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Categories() {
  const navigate = useNavigate();
  const { isVerifying } = useAuth();
  const { stores, activeStore, setActiveStore } = useAppStore();
  const { fetchCategories, invalidate } = useCategoryStore();

  const storeUsername = activeStore?.username ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterActive, setFilterActive] = useState<'All' | 'Active' | 'Inactive'>('All');

  const [dialog, setDialog] = useState<null | { mode: 'create'; defaultParentId: number | null } | { mode: 'edit'; category: Category }>(null);
  const [toggleTarget, setToggleTarget] = useState<{ category: Category; type: 'activate' | 'deactivate' } | null>(null);
  const [toggling, setToggling]         = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!storeUsername) return;
    setLoading(true); setError(null);
    const list = await fetchCategories(storeUsername, force);
    if (list !== null) setCategories(list);
    else setError('Failed to load categories.');
    setLoading(false);
  }, [storeUsername, fetchCategories]);

  useEffect(() => {
    if (storeUsername && !isVerifying) load();
  }, [storeUsername, isVerifying, load]);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true); setActionError(null);
    try {
      if (toggleTarget.type === 'activate') await activateCategories(toggleTarget.category.id);
      else                                  await deactivateCategories(toggleTarget.category.id);
      invalidate(storeUsername);
      setToggleTarget(null);
      await load(true);
    } catch (err: any) { setActionError(err?.message || `Failed to ${toggleTarget.type}.`); }
    finally { setToggling(false); }
  };

  // Tree helpers
  const parentCategories = categories.filter(c => !c.parentId || c.parentId === 0);
  const childrenOf = (id: number) => categories.filter(c => c.parentId === id);

  // Filter
  const q = search.toLowerCase();
  const matchesCat = (c: Category) => {
    const matchName = !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    const isActive  = c.active !== false;
    return matchName && (filterActive === 'All' || (filterActive === 'Active' ? isActive : !isActive));
  };

  const isFiltering    = !!q || filterActive !== 'All';
  const displayedRows  = isFiltering ? categories.filter(matchesCat) : parentCategories;
  const parentCount    = parentCategories.length;
  const childCount     = categories.filter(c => c.parentId && c.parentId !== 0).length;

  if (isVerifying) return <div className="flex items-center justify-center h-screen dark:bg-slate-900"><p className="text-gray-500 dark:text-slate-400 text-sm">Loading…</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-5 md:p-7">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <StoreSwitcher stores={stores} activeStore={activeStore} setActiveStore={setActiveStore} onSwitch={() => setCategories([])} />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => load(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">🔄 Refresh</button>
          <button onClick={() => setDialog({ mode: 'create', defaultParentId: null })} disabled={!storeUsername}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
            + Add Category
          </button>
        </div>
      </div>

      {/* Errors */}
      {error && <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"><span>⚠️ {error}</span><button onClick={() => load(true)} className="ml-4 text-xs font-semibold underline">Retry</button></div>}
      {actionError && <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"><span>⚠️ {actionError}</span><button onClick={() => setActionError(null)} className="ml-2 text-lg leading-none text-red-400 hover:text-red-600">×</button></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',    value: categories.length,                                 icon: '🏷️', color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20'  },
          { label: 'Parents',  value: parentCount,                                        icon: '📁', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700'  },
          { label: 'Active',   value: categories.filter(c => c.active !== false).length,  icon: '✅', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Inactive', value: categories.filter(c => c.active === false).length,  icon: '⏸️', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700'  },
        ].map(s => (
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or slug…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-colors dark:placeholder:text-slate-500" />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterActive(s)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${filterActive === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-50 dark:border-slate-700 last:border-0 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded w-40" /><div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded w-24" /></div>
              <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-16" />
              <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-xl w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Legend bar */}
          {!isFiltering && parentCount > 0 && (
            <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20 flex items-center gap-4">
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1"><span>📁</span> {parentCount} parent {parentCount === 1 ? 'category' : 'categories'}</span>
              {childCount > 0 && <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1"><span>↳</span> {childCount} sub-{childCount === 1 ? 'category' : 'categories'}</span>}
              <span className="text-xs text-slate-300 dark:text-slate-600 ml-1">· Click ▸ to expand/collapse</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  {['Category', 'Slug', 'Description', 'Order', 'Status', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {displayedRows.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    children={isFiltering ? [] : childrenOf(cat.id)}
                    onEdit={c => setDialog({ mode: 'edit', category: c })}
                    onToggle={(c, t) => setToggleTarget({ category: c, type: t })}
                    onAddChild={pid => setDialog({ mode: 'create', defaultParentId: pid })}
                    depth={isFiltering && cat.parentId && cat.parentId !== 0 ? 1 : 0}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {displayedRows.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🏷️</div>
              <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
                {search ? 'No categories match your search' : 'No categories yet'}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {search ? 'Try a different search term' : 'Create your first category to organise products'}
              </p>
              {!search && (
                <button onClick={() => setDialog({ mode: 'create', defaultParentId: null })}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  + Add Category
                </button>
              )}
            </div>
          )}

          {displayedRows.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isFiltering ? `Showing ${displayedRows.length} of ${categories.length}` : `${parentCount} parent · ${childCount} sub-categories`}
              </span>
              <button onClick={() => navigate('/products/add')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">+ Add product →</button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {dialog?.mode === 'create' && (
        <CategoryDialog mode="create" defaultParentId={dialog.defaultParentId} parents={parentCategories} storeUsername={storeUsername}
          onSuccess={() => { setDialog(null); invalidate(storeUsername); load(true); }} onClose={() => setDialog(null)} />
      )}
      {dialog?.mode === 'edit' && (
        <CategoryDialog mode="edit" initial={dialog.category} parents={parentCategories} storeUsername={storeUsername}
          onSuccess={() => { setDialog(null); invalidate(storeUsername); load(true); }} onClose={() => setDialog(null)} />
      )}
      {toggleTarget && (
        <ToggleConfirmDialog type={toggleTarget.type} category={toggleTarget.category} onConfirm={handleToggle} onCancel={() => setToggleTarget(null)} loading={toggling} />
      )}
    </div>
  );
}