import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/productService';
import { userDetails } from '../../services/userService';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Store } from '../../types/store';
import CategorySelector from '../Categories/CategorySelector';
import CloudinaryUploadWidget from '../../ImageUpload';

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/30 dark:placeholder:text-slate-500";
const lbl  = "block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300";

// Outside component — never recreated on re-render
// const UW_CONFIG: Record<string, unknown> = {
//   cloudName:            import.meta.env.VITE_CLOUD_NAME ?? '',
//   uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET,
//   multiple:             false,
//   clientAllowedFormats: ['image'],
// };

const MAX_ADDITIONAL_IMAGES = 2; // main image + 2 additional = 3 total

interface FormData {
  name:           string;
  slug:           string;
  description:    string;
  categoryIds:    number[];
  tags:           string;
  imageUrl:       string;
  images:         string[];
  price:          string;
  compareAtPrice: string;
  currency:       string;
  stockCount:     string;
  inStock:        boolean;
  isFeatured:     boolean;
}

const emptyForm = (): FormData => ({
  name: '', slug: '', description: '', categoryIds: [],
  tags: '', imageUrl: '', images: [], price: '', compareAtPrice: '', currency: 'INR',
  stockCount: '', inStock: true, isFeatured: false,
});

const autoSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AddProduct() {
  const navigate = useNavigate();

  const [stores, setStores]               = useState<Store[]>([]);
  const [activeStore, setActiveStore]     = useState<Store | null>(null);
  const [storeDropdown, setStoreDropdown] = useState(false);
  const [initError, setInitError]         = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory'>('basic');
  const [dragOver, setDragOver]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [form, setForm]           = useState<FormData>(emptyForm());

  const storeUsername = activeStore?.username ?? '';

  const UW_CONFIG = useMemo(() => ({
    cloudName:            import.meta.env.VITE_CLOUD_NAME,
    uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET,
    multiple:             false,
    clientAllowedFormats: ['image'],
  }), []); // empty deps — env vars never change at runtime

  const { fetchCategories } = useCategoryStore();
  useEffect(() => {
    if (storeUsername) fetchCategories(storeUsername);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUsername]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await userDetails();
        const userStores: Store[] = res?.data?.stores ?? [];
        if (userStores.length === 0) {
          setInitError('No store found. Please create a store first.');
          return;
        }
        setStores(userStores);
        setActiveStore(userStores[0]);
      } catch {
        setInitError('Failed to load store info.');
      }
    };
    init();
  }, []);

  const switchStore = (store: Store) => {
    setActiveStore(store);
    setStoreDropdown(false);
  };

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev, name,
      slug: prev.slug === '' || prev.slug === autoSlug(prev.name) ? autoSlug(name) : prev.slug,
    }));
  };

  // Stable callbacks via useCallback — won't cause widget re-init
  const handleMainImageUpload = useCallback((url: string) => {
    setForm(prev => ({ ...prev, imageUrl: url }));
  }, []);

  const handleAdditionalImageUpload = useCallback((url: string) => {
    setForm(prev => {
      if (prev.images.length >= MAX_ADDITIONAL_IMAGES) return prev;
      return { ...prev, images: [...prev.images, url] };
    });
  }, []);

  const removeAdditionalImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const validate = (): string | null => {
    if (!form.name.trim())                      { setActiveTab('basic');     return 'Product name is required.'; }
    if (!form.slug.trim())                      { setActiveTab('basic');     return 'Slug is required.'; }
    if (form.categoryIds.length === 0)          { setActiveTab('basic');     return 'At least one category is required.'; }
    if (!form.price || Number(form.price) <= 0) { setActiveTab('pricing');   return 'Selling price must be greater than 0.'; }
    if (!form.stockCount)                       { setActiveTab('inventory'); return 'Stock count is required.'; }
    return null;
  };

  const handlePublish = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!storeUsername)  { setError('Store not loaded yet. Please wait.'); return; }

    setSaving(true);
    setError(null);
    try {
      await createProduct(storeUsername, {
        name:           form.name.trim(),
        slug:           form.slug.trim(),
        description:    form.description.trim(),
        categoryIds:    form.categoryIds,
        price:          Number(form.price),
        compareAtPrice: Number(form.compareAtPrice) || 0,
        currency:       form.currency,
        imageUrl:       form.imageUrl.trim(),
        images:         form.images,           // already string[], sent as-is
        tags:           form.tags.split(',').map(t => t.trim()).filter(Boolean),
        inStock:        form.inStock,
        stockCount:     Number(form.stockCount) || 0,
        isFeatured:     form.isFeatured,
      });
      navigate('/products');
    } catch (err: any) {
      setError(err?.message || 'Failed to create product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const discount = form.compareAtPrice && form.price
    ? Math.round((1 - Number(form.price) / Number(form.compareAtPrice)) * 100)
    : 0;

  const checklist = [
    { label: 'Product name',      done: !!form.name },
    { label: 'Category selected', done: form.categoryIds.length > 0 },
    { label: 'Slug added',        done: !!form.slug },
    { label: 'Selling price set', done: !!form.price },
    { label: 'Stock quantity',    done: !!form.stockCount },
    { label: 'Description',       done: !!form.description },
    { label: 'Main image',        done: !!form.imageUrl },
  ];
  const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  const tabs = [
    { id: 'basic',     label: 'Basic Info',    icon: '📝' },
    { id: 'pricing',   label: 'Pricing & Tax', icon: '💰' },
    { id: 'inventory', label: 'Inventory',     icon: '📦' },
  ] as const;

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">{initError}</p>
          <button onClick={() => navigate('/products')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-5 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-base hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 text-slate-700 dark:text-slate-300">
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
            {stores.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Loading store...</p>}
            {stores.length === 1 && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Adding to @{storeUsername}</p>}
            {stores.length > 1 && (
              <div className="relative mt-1.5">
                <button onClick={() => setStoreDropdown(v => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  {activeStore?.logoUrl && (
                    <img src={activeStore.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">{activeStore?.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">@{activeStore?.username}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-md px-1.5 py-0.5 font-semibold">{stores.length} stores</span>
                  <span className="text-slate-400 text-xs">▾</span>
                </button>
                {storeDropdown && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setStoreDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1.5 z-[101] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl py-1.5 min-w-[260px]">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-2 pb-1">Add product to</p>
                      {stores.map(store => (
                        <button key={store.id} onClick={() => switchStore(store)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${activeStore?.id === store.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {store.logoUrl
                              ? <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <span className="text-base">🏪</span>
                            }
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
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate('/products')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handlePublish} disabled={saving || !storeUsername}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md shadow-blue-200 flex items-center gap-2 ${saving || !storeUsername ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
              : '🚀 Publish'
            }
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* LEFT: Main form */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1.5 flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── BASIC INFO ── */}
          {activeTab === 'basic' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Product Information</h2>
              <div className="space-y-4">

                <div>
                  <label className={lbl}>Product Name <span className="text-red-500">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Wireless Bluetooth Earbuds Pro"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Slug <span className="text-red-500">*</span></label>
                  <input
                    value={form.slug}
                    onChange={e => update('slug', e.target.value)}
                    placeholder="wireless-bluetooth-earbuds-pro"
                    className={`${inp} font-mono text-blue-600 dark:text-blue-400`}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Auto-generated from name · must be unique</p>
                </div>

                <CategorySelector
                  storeUsername={storeUsername}
                  selectedIds={form.categoryIds}
                  onChange={ids => update('categoryIds', ids)}
                  allowCreate
                  required
                />

                <div>
                  <label className={lbl}>Tags <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(comma separated)</span></label>
                  <input
                    value={form.tags}
                    onChange={e => update('tags', e.target.value)}
                    placeholder="wireless, earbuds, bluetooth"
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="Describe your product in detail..."
                    rows={5}
                    className={`${inp} resize-y leading-relaxed`}
                  />
                </div>

                {/* ── Main Image Upload ── */}
                <div>
                  <label className={lbl}>Main Image</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <CloudinaryUploadWidget uwConfig={UW_CONFIG} onUpload={handleMainImageUpload} />
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
                  {form.imageUrl && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 truncate">{form.imageUrl}</p>
                  )}
                </div>

                {/* ── Additional Images (max 2) ── */}
                <div>
                  <label className={lbl}>
                    Additional Images
                    <span className="text-slate-400 dark:text-slate-500 font-normal text-xs ml-1.5">
                      ({form.images.length}/{MAX_ADDITIONAL_IMAGES} · {MAX_ADDITIONAL_IMAGES + 1} total max)
                    </span>
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {form.images.map((url, i) => (
                      <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        <img src={url} alt={`Additional ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                        >✕</button>
                      </div>
                    ))}
                    {form.images.length < MAX_ADDITIONAL_IMAGES && (
                      <CloudinaryUploadWidget uwConfig={UW_CONFIG} onUpload={handleAdditionalImageUpload} />
                    )}
                  </div>
                  {form.images.length >= MAX_ADDITIONAL_IMAGES && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Maximum additional images reached. Remove one to upload another.
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── PRICING ── */}
          {activeTab === 'pricing' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Pricing & Tax Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Selling Price (₹) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm">₹</span>
                      <input
                        value={form.price}
                        onChange={e => update('price', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        min="0"
                        className={`${inp} pl-7`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>MRP / Original Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm">₹</span>
                      <input
                        value={form.compareAtPrice}
                        onChange={e => update('compareAtPrice', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        min="0"
                        className={`${inp} pl-7`}
                      />
                    </div>
                  </div>
                </div>

                {discount > 0 && (
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="text-base font-bold text-green-700 dark:text-green-400">{discount}% OFF</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Customers save ₹{(Number(form.compareAtPrice) - Number(form.price)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className={lbl}>Currency</label>
                  <select value={form.currency} onChange={e => update('currency', e.target.value)} className={inp}>
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                  </select>
                </div>

                {form.price && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Price Breakdown</p>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Selling Price</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">₹{Number(form.price).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── INVENTORY ── */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Inventory Management</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Available Stock <span className="text-red-500">*</span></label>
                    <input
                      value={form.stockCount}
                      onChange={e => update('stockCount', e.target.value)}
                      placeholder="0"
                      type="number"
                      min="0"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Availability</label>
                    <select
                      value={form.inStock ? 'true' : 'false'}
                      onChange={e => update('inStock', e.target.value === 'true')}
                      className={inp}
                    >
                      <option value="true">✅ In Stock</option>
                      <option value="false">❌ Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* ── isFeatured toggle ── */}
                <div>
                  <label className={lbl}>Featured / Sale Event</label>
                  <div
                    onClick={() => update('isFeatured', !form.isFeatured)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${form.isFeatured ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                    <div className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${form.isFeatured ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isFeatured ? 'left-[22px]' : 'left-0.5'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${form.isFeatured ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {form.isFeatured ? '⭐ Featured Product' : 'Not Featured'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Flag for special occasions, events, or sale campaigns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-4">

          {/* Image preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Product Images</h3>

            {/* Main image preview */}
            {form.imageUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 mb-3">
                <img
                  src={form.imageUrl}
                  alt="Main preview"
                  className="w-full h-40 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all mb-3 ${dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 hover:border-blue-300'}`}>
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No image yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Upload one in the Basic Info tab</p>
              </div>
            )}

            {/* Additional image thumbnails */}
            {form.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {form.images.map((url, i) => (
                  <div key={url} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                    <img
                      src={url}
                      alt={`Extra ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">
              {form.imageUrl ? '1 main' : '0 main'} + {form.images.length} additional image{form.images.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Publish Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Publish Settings</h3>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Publishing to</label>
                <div className={`${inp} bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed`}>
                  {storeUsername ? `@${storeUsername}` : 'Loading...'}
                </div>
              </div>
              <div>
                <label className={lbl}>Currency</label>
                <select value={form.currency} onChange={e => update('currency', e.target.value)} className={inp}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Listing Checklist</h3>
            <div className="space-y-0">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5 py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <span className="text-sm">{done ? '✅' : '⬜'}</span>
                  <span className={`text-sm ${done ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{progress}% complete</p>
          </div>

          {/* Bottom publish button */}
          <button onClick={handlePublish} disabled={saving || !storeUsername}
            className={`w-full py-3 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${saving || !storeUsername ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'}`}>
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
              : '🚀 Publish Product'
            }
          </button>
        </div>
      </div>
    </div>
  );
}