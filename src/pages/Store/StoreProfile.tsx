// src/pages/Store/StoreProfile.tsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateStore } from "../../services/storeService";
import { useAppStore } from "../../store/useAppStore";
import type { Store, CreateStoreBody } from "../../types/store";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const THEMES = [
  { id: "MINIMAL_LIGHT", label: "Minimal Light", icon: "☀️" },
  { id: "MINIMAL_DARK",  label: "Minimal Dark",  icon: "🌙" },
  { id: "BOLD_LIGHT",    label: "Bold Light",    icon: "🎨" },
  { id: "BOLD_DARK",     label: "Bold Dark",     icon: "🎨" },
  { id: "CLASSIC",       label: "Classic",       icon: "🏛️" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

type DraftStore = {
  name: string; bio: string; logoUrl: string; bannerUrl: string; theme: string;
  instagram: string; whatsapp: string; facebook: string; twitter: string;
};

function storeToDraft(store: Store): DraftStore {
  return {
    name:      store.name,
    bio:       store.bio      ?? "",
    logoUrl:   store.logoUrl  ?? "",
    bannerUrl: store.bannerUrl ?? "",
    theme:     store.theme    ?? "MINIMAL_LIGHT",
    instagram: store.socialLinks?.instagram ?? "",
    whatsapp:  store.socialLinks?.whatsapp  ?? "",
    facebook:  store.socialLinks?.facebook  ?? "",
    twitter:   store.socialLinks?.twitter   ?? "",
  };
}

export default function StoreProfile() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Read from global store — zero network calls on mount ──────────────────
  const { stores, activeStore: globalActive, setActiveStore, updateStoreInList, authStatus } = useAppStore();

  const passedUsername: string | undefined = (location.state as any)?.storeUsername;

  // Resolve which store to show: prefer location.state username, else globalActive, else first
  const resolvedStore: Store | null =
    (passedUsername && stores.find((s) => s.username === passedUsername)) ||
    globalActive ||
    stores[0] ||
    null;

  const [activeStore, setLocalActive] = useState<Store | null>(resolvedStore);
  const [draft,       setDraft]       = useState<DraftStore | null>(resolvedStore ? storeToDraft(resolvedStore) : null);
  const [isEditing,   setIsEditing]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  // If stores load after render (edge case: landing directly on this page)
  useEffect(() => {
    if (!activeStore && resolvedStore) {
      setLocalActive(resolvedStore);
      setDraft(storeToDraft(resolvedStore));
    }
  }, [resolvedStore]);

  const switchStore = (store: Store) => {
    if (isEditing) return;
    setLocalActive(store);
    setDraft(storeToDraft(store));
    setActiveStore(store);         // keep global in sync
    setSaveError(null);
  };

  const handleEdit = () => {
    if (activeStore) setDraft(storeToDraft(activeStore));
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    if (activeStore) setDraft(storeToDraft(activeStore));
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!activeStore || !draft) return;
    setSaving(true);
    setSaveError(null);

    const body: Partial<CreateStoreBody> = {
      name: draft.name, bio: draft.bio,
      logoUrl: draft.logoUrl, bannerUrl: draft.bannerUrl, theme: draft.theme,
      socialLinks: {
        instagram: draft.instagram, whatsapp: draft.whatsapp,
        facebook: draft.facebook,   twitter: draft.twitter,
      },
    };

    try {
      const response = await updateStore(activeStore.username, body);
      const updated: Store = { ...activeStore, ...response.data };

      setLocalActive(updated);
      setDraft(storeToDraft(updated));
      updateStoreInList(updated);   // ← updates Zustand; UserProfiles sees it instantly
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (field: keyof DraftStore, value: string) =>
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);

  // ── Loading / error guards ────────────────────────────────────────────────
  if (authStatus === "loading" || authStatus === "idle") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading store profile...</p>
      </div>
    );
  }

  if (!activeStore || !draft) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-sm">Store not found.</p>
      </div>
    );
  }

  const inp =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all";

  return (
    <div className="p-4">
      <PageMeta title="Store Profile | Storly Dashboard" description="Manage your store profile" />
      <PageBreadcrumb pageTitle="Store Profile" />

      <div className="space-y-5">

        {/* ── Store Switcher ── */}
        {stores.length > 1 && (
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Switch store
            </p>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => switchStore(store)}
                  disabled={isEditing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    activeStore.username === store.username
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {store.logoUrl
                    ? <img src={store.logoUrl} alt="" className="w-5 h-5 rounded-md object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <span className="text-xs">🏪</span>}
                  {store.name}
                </button>
              ))}
            </div>
            {isEditing && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Save or cancel your changes before switching stores.
              </p>
            )}
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeStore.name}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              storly.co.in/{activeStore.username} · Created {formatDate(activeStore.createdAt)}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!isEditing ? (
              <>
                <button onClick={() => navigate("/store/create-store")}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  + New store
                </button>
                <button onClick={handleEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 dark:shadow-none">
                  Edit profile
                </button>
              </>
            ) : (
              <>
                <button onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors shadow-md shadow-blue-200 dark:shadow-none ${
                    saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {saveError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {saveError}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Info */}
            <Section title="Store details" badge={isEditing ? "Editing" : undefined}>
              <div className="space-y-4">
                <Field label="Store name">
                  {isEditing
                    ? <input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} className={inp} />
                    : <ReadonlyField value={activeStore.name} />}
                </Field>
                <Field label="Username (URL)">
                  <ReadonlyField value={`storly.co.in/${activeStore.username}`} muted />
                  {isEditing && <p className="text-xs text-gray-400 mt-1">Store URL cannot be changed after creation.</p>}
                </Field>
                <Field label="Bio / description">
                  {isEditing
                    ? <textarea value={draft.bio} onChange={(e) => updateDraft("bio", e.target.value)}
                        rows={4} maxLength={500} className={`${inp} resize-y leading-relaxed`} />
                    : <ReadonlyField value={activeStore.bio || "—"} />}
                </Field>
              </div>
            </Section>

            {/* Appearance */}
            <Section title="Appearance">
              <div className="space-y-4">
                <Field label="Theme">
                  {isEditing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {THEMES.map((t) => (
                        <button key={t.id} onClick={() => updateDraft("theme", t.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                            draft.theme === t.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}>
                          <span className="text-base">{t.icon}</span>
                          <span className="text-xs">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : <ReadonlyField value={activeStore.theme?.replace(/_/g, " ")} />}
                </Field>
                <Field label="Logo URL">
                  {isEditing
                    ? <input value={draft.logoUrl} onChange={(e) => updateDraft("logoUrl", e.target.value)}
                        type="url" placeholder="https://example.com/logo.png" className={inp} />
                    : <ReadonlyField value={activeStore.logoUrl || "Not set"} muted={!activeStore.logoUrl} />}
                  {(isEditing ? draft.logoUrl : activeStore.logoUrl) && (
                    <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <img src={isEditing ? draft.logoUrl : activeStore.logoUrl} alt="Logo preview"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <p className="text-xs text-gray-400">Logo preview</p>
                    </div>
                  )}
                </Field>
                <Field label="Banner URL">
                  {isEditing
                    ? <input value={draft.bannerUrl} onChange={(e) => updateDraft("bannerUrl", e.target.value)}
                        type="url" placeholder="https://example.com/banner.jpg" className={inp} />
                    : <ReadonlyField value={activeStore.bannerUrl || "Not set"} muted={!activeStore.bannerUrl} />}
                  {(isEditing ? draft.bannerUrl : activeStore.bannerUrl) && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={isEditing ? draft.bannerUrl : activeStore.bannerUrl} alt="Banner preview"
                        className="w-full h-20 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </Field>
              </div>
            </Section>

            {/* Social Links */}
            <Section title="Social links">
              <div className="space-y-4">
                {([
                  { field: "instagram" as const, label: "Instagram",   prefix: "instagram.com/", placeholder: "yourhandle"    },
                  { field: "whatsapp"  as const, label: "WhatsApp",    prefix: "+",               placeholder: "911234567890" },
                  { field: "facebook"  as const, label: "Facebook",    prefix: "facebook.com/",   placeholder: "yourpage"     },
                  { field: "twitter"   as const, label: "Twitter / X", prefix: "x.com/",          placeholder: "yourhandle"   },
                ]).map(({ field, label, prefix, placeholder }) => (
                  <Field key={field} label={label}>
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium select-none whitespace-nowrap" style={{ pointerEvents: "none" }}>
                          {prefix}
                        </span>
                        <input value={draft[field]} onChange={(e) => updateDraft(field, e.target.value)}
                          placeholder={placeholder} className={inp}
                          style={{ paddingLeft: `${prefix.length * 7 + 14}px` }} />
                      </div>
                    ) : (
                      <ReadonlyField
                        value={activeStore.socialLinks?.[field] ? `${prefix}${activeStore.socialLinks[field]}` : "Not set"}
                        muted={!activeStore.socialLinks?.[field]}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Store preview</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative h-16 bg-gradient-to-r from-blue-400 to-indigo-500">
                  {(isEditing ? draft.bannerUrl : activeStore.bannerUrl) && (
                    <img src={isEditing ? draft.bannerUrl : activeStore.bannerUrl} alt="banner"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="absolute left-3 -bottom-5 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow overflow-hidden flex items-center justify-center text-sm z-10">
                    {(isEditing ? draft.logoUrl : activeStore.logoUrl)
                      ? <img src={isEditing ? draft.logoUrl : activeStore.logoUrl} alt="logo"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : "🏪"}
                  </div>
                </div>
                <div className="px-3 pt-7 pb-3 bg-white dark:bg-slate-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {(isEditing ? draft.name : activeStore.name) || "Store name"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">storly.co.in/{activeStore.username}</p>
                  {(isEditing ? draft.bio : activeStore.bio) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {isEditing ? draft.bio : activeStore.bio}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {(isEditing ? draft.instagram : activeStore.socialLinks?.instagram) && <span className="text-[10px] bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-full">📸 IG</span>}
                    {(isEditing ? draft.whatsapp  : activeStore.socialLinks?.whatsapp)  && <span className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">💬 WA</span>}
                    {(isEditing ? draft.facebook  : activeStore.socialLinks?.facebook)  && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">📘 FB</span>}
                    {(isEditing ? draft.twitter   : activeStore.socialLinks?.twitter)   && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">🐦 X</span>}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2.5 text-center">Updates live as you edit</p>
            </div>

            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Store info</p>
              <div className="space-y-0">
                <SideRow label="Store ID"  value={activeStore.id.slice(0, 8) + "..."} />
                <SideRow label="Username"  value={activeStore.username} />
                <SideRow label="Theme"     value={activeStore.theme?.replace(/_/g, " ")} />
                <SideRow label="Created"   value={formatDate(activeStore.createdAt)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {badge && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ReadonlyField({ value, muted }: { value: string; muted?: boolean }) {
  return (
    <div className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-sm ${
      muted ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
    }`}>
      {value}
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-900 dark:text-white text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}