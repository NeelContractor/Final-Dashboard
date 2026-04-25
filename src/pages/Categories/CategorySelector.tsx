// src/components/categories/CategorySelector.tsx
//
// Multi-select category picker. Works with category IDs (number[]).
// Renders parent categories with their children indented under them.
// Supports inline creation of new categories.
//
// Props:
//   storeUsername  — which store to load categories for
//   selectedIds    — currently selected category IDs
//   onChange       — (ids: number[]) => void
//   allowCreate    — show inline create form (default true)
//   required       — show red asterisk on label (default false)
//   label          — label text (default "Categories")
//   maxSelect      — max selectable (default unlimited)

import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Category } from '../../store/useCategoryStore';
import { createCategories } from '../../services/productService';
import { useNavigate } from 'react-router-dom';

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30 dark:placeholder:text-slate-500";
const lbl = "block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300";

const autoSlug = (n: string) =>
  n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Inline create form ────────────────────────────────────────────────────────

function NewCategoryForm({ storeUsername, parents, onCreated, onCancel }: {
  storeUsername: string;
  parents: Category[];
  onCreated: (cat: Category) => void;
  onCancel: () => void;
}) {
  const [name,     setName]     = useState('');
  const [slug,     setSlug]     = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const { invalidate } = useCategoryStore();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(prev => prev === '' || prev === autoSlug(name) ? autoSlug(val) : prev);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!slug.trim()) { setError('Slug is required.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await createCategories(storeUsername, {
        name: name.trim(), slug: slug.trim(), description: '', imageUrl: '',
        parentId: parentId ?? 0, displayOrder: 0,
      });
      // Optimistically build the category object; real ID comes from API if returned
      const newCat: Category = {
        id:       (res as any)?.data?.id ?? Date.now(),
        name:     name.trim(),
        slug:     slug.trim(),
        parentId: parentId ?? undefined,
        active:   true,
      };
      invalidate(storeUsername);
      onCreated(newCat);
    } catch (err: any) {
      setError(err?.message || 'Failed to create category.');
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4 space-y-3">
      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>🏷️</span> New Category
      </p>
      {error && (
        <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {parents.length > 0 && (
          <div className="sm:col-span-2">
            <label className={lbl}>Parent <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <select value={parentId ?? ''} onChange={e => setParentId(e.target.value === '' ? null : Number(e.target.value))} className={inp}>
              <option value="">Root (top-level)</option>
              {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={lbl}>Name <span className="text-red-500">*</span></label>
          <input ref={ref} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Electronics" className={inp} />
        </div>
        <div>
          <label className={lbl}>Slug <span className="text-red-500">*</span></label>
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="electronics" className={`${inp} font-mono text-blue-600 dark:text-blue-400`} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
          {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : '✓ Create'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Selector ─────────────────────────────────────────────────────────────

interface CategorySelectorProps {
  storeUsername: string;
  selectedIds:   number[];
  onChange:      (ids: number[]) => void;
  allowCreate?:  boolean;
  required?:     boolean;
  label?:        string;
  className?:    string;
}

export default function CategorySelector({
  storeUsername,
  selectedIds,
  onChange,
  allowCreate = true,
  required    = false,
  label       = 'Categories',
  className   = '',
}: CategorySelectorProps) {
  const navigate = useNavigate();
  const { fetchCategories } = useCategoryStore(); // removed loading

  const [categories,  setCategories]  = useState<Category[]>([]);
  const [fetchState,  setFetchState]  = useState<'idle' | 'loading' | 'error' | 'empty' | 'loaded'>('idle');
  const [showNew,     setShowNew]     = useState(false);

  // const isLoading = loading[storeUsername] ?? false;

  useEffect(() => {
    if (!storeUsername) return;
    let cancelled = false;
    setFetchState('loading');

    fetchCategories(storeUsername).then(list => {
      if (cancelled) return;
      if (list === null)      { setFetchState('error'); }
      else if (list.length === 0) { setFetchState('empty'); setCategories([]); }
      else                    { setFetchState('loaded'); setCategories(list); }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUsername]);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else                          onChange([...selectedIds, id]);
  };

  const handleCreated = (cat: Category) => {
    setCategories(prev => [...prev, cat]);
    setFetchState('loaded');
    onChange([...selectedIds, cat.id]);
    setShowNew(false);
  };

  // Group into parent → children
  const parents  = categories.filter(c => !c.parentId || c.parentId === 0);
  const children = (parentId: number) => categories.filter(c => c.parentId === parentId);

  const selectedNames = selectedIds
    .map(id => categories.find(c => c.id === id)?.name)
    .filter(Boolean);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {allowCreate && fetchState === 'loaded' && !showNew && (
          <button type="button" onClick={() => setShowNew(true)}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            + New category
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {(fetchState === 'idle' || fetchState === 'loading') && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 text-sm">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin shrink-0" />
          Loading categories…
        </div>
      )}

      {/* ── Error ── */}
      {fetchState === 'error' && (
        <div className="px-3.5 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
          <span>⚠️ Couldn't load categories.</span>
          <button type="button" onClick={() => { setFetchState('loading'); fetchCategories(storeUsername, true).then(list => { if (list === null) setFetchState('error'); else if (list.length === 0) { setFetchState('empty'); setCategories([]); } else { setFetchState('loaded'); setCategories(list); } }); }} className="text-xs font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* ── Empty: 200 but no categories ── */}
      {fetchState === 'empty' && !showNew && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No categories yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Create one here or{' '}
              <button type="button" onClick={() => navigate('/products/categories')} className="text-blue-600 dark:text-blue-400 underline font-medium">manage categories</button>.
            </p>
          </div>
          {allowCreate && (
            <button type="button" onClick={() => setShowNew(true)}
              className="shrink-0 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
              + Create
            </button>
          )}
        </div>
      )}

      {/* ── Loaded: checkbox list ── */}
      {fetchState === 'loaded' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {/* Selected pills */}
          {selectedNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {selectedIds.map(id => {
                const cat = categories.find(c => c.id === id);
                if (!cat) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {cat.name}
                    <button type="button" onClick={() => toggle(id)} className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 ml-0.5 text-sm leading-none">×</button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Scrollable checkbox list */}
          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
            {parents.map(parent => (
              <div key={parent.id}>
                {/* Parent row */}
                <label className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(parent.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(parent.id)}
                    onChange={() => toggle(parent.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{parent.name}</span>
                  {parent.active === false && <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">Inactive</span>}
                </label>

                {/* Children */}
                {children(parent.id).map(child => (
                  <label key={child.id} className={`flex items-center gap-2.5 pl-8 pr-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(child.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(child.id)}
                      onChange={() => toggle(child.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span className="text-slate-300 dark:text-slate-600">↳</span> {child.name}
                    </span>
                    {child.active === false && <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">Inactive</span>}
                  </label>
                ))}
              </div>
            ))}
          </div>

          {parents.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2">No categories found.</p>
          )}
        </div>
      )}

      {/* ── Inline create form ── */}
      {showNew && (
        <NewCategoryForm
          storeUsername={storeUsername}
          parents={categories.filter(c => !c.parentId || c.parentId === 0)}
          onCreated={handleCreated}
          onCancel={() => setShowNew(false)}
        />
      )}

      {selectedIds.length === 0 && fetchState === 'loaded' && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Select one or more categories above</p>
      )}
    </div>
  );
}