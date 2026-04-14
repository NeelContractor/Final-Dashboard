import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStore } from "../../services/storeService";

const THEMES = [
  { id: "MINIMAL_LIGHT", label: "Minimal Light", desc: "Clean & airy", icon: "☀️" },
  { id: "MINIMAL_DARK",  label: "Minimal Dark",  desc: "Sleek & bold",  icon: "🌙" },
  { id: "BOLD_LIGHT",    label: "Bold Light",    desc: "Bold & Light", icon: "🎨" },
  { id: "BOLD_DARK",     label: "Bold Dark",     desc: "Bold & Dark", icon: "🎨" },
  { id: "CLASSIC",       label: "Classic",       desc: "Timeless & elegant", icon: "🏛️" },
];

interface FormData {
  username: string;
  name: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  theme: string;
  instagram: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
}

export default function CreateStore() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"basic" | "appearance" | "social">("basic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    username: "",
    name: "",
    bio: "",
    logoUrl: "",
    bannerUrl: "",
    theme: "MINIMAL_LIGHT",
    instagram: "",
    whatsapp: "",
    facebook: "",
    twitter: "",
  });

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.username || !form.name) {
      setError("Store username and name are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createStore({
        username: form.username,
        name: form.name,
        bio: form.bio,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        theme: form.theme,
        socialLinks: {
          instagram: form.instagram,
          whatsapp: form.whatsapp,
          facebook: form.facebook,
          twitter: form.twitter,
        },
      });
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Failed to create store. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // const checklist = [
  //   { label: "Store username",  done: !!form.username },
  //   { label: "Store name",      done: !!form.name },
  //   { label: "Bio / description", done: !!form.bio },
  //   { label: "Theme selected",  done: !!form.theme },
  //   { label: "Logo URL",        done: !!form.logoUrl },
  //   { label: "Social link",     done: !!(form.instagram || form.whatsapp || form.facebook || form.twitter) },
  // ];
  // const progress = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const tabs = [
    { id: "basic",      label: "Basic Info",   icon: "🏪" },
    { id: "appearance", label: "Appearance",   icon: "🎨" },
    { id: "social",     label: "Social Links", icon: "🔗" },
  ] as const;

  const inp =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const lbl = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-7">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-base hover:bg-slate-50 transition-colors shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Create Your Store</h1>
            <p className="text-sm text-slate-500 mt-0.5">Set up your online storefront in minutes</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md shadow-blue-200 flex items-center gap-2 ${
              saving ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "⏳ Creating..." : "🚀 Launch Store"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── LEFT: Main form ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── BASIC INFO ── */}
          {activeTab === "basic" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Store Details</h2>
              <p className="text-sm text-slate-400 mb-5">This is how customers will find and identify your store.</p>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className={lbl}>
                    Store Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                      storly.co.in/
                    </span>
                    <input
                      value={form.username}
                      onChange={(e) => update("username", e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      placeholder="yourstore"
                      className={`${inp} pl-[100px] font-mono`}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>

                {/* Store Name */}
                <div>
                  <label className={lbl}>
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. My Awesome Shop"
                    className={inp}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className={lbl}>Bio / Description</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    placeholder="Tell customers what your store is about..."
                    rows={4}
                    minLength={0}
                    maxLength={500}
                    className={`${inp} resize-y leading-relaxed`}
                  />
                  <p className="text-xs text-slate-400 mt-1">{form.bio.length}/300 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Store Appearance</h2>
              <p className="text-sm text-slate-400 mb-5">Customize how your store looks to customers.</p>

              <div className="space-y-5">
                {/* Theme Picker */}
                <div>
                  <label className={lbl}>Store Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => update("theme", t.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                          form.theme === t.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <div>
                          <p className={`text-xs font-bold ${form.theme === t.id ? "text-blue-700" : "text-slate-700"}`}>
                            {t.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                        </div>
                        {form.theme === t.id && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo URL */}
                <div>
                  <label className={lbl}>Logo URL</label>
                  <input
                    value={form.logoUrl}
                    onChange={(e) => update("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    type="url"
                    className={inp}
                  />
                  {form.logoUrl && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <p className="text-xs text-slate-500">Logo preview</p>
                    </div>
                  )}
                </div>

                {/* Banner URL */}
                <div>
                  <label className={lbl}>Banner URL</label>
                  <input
                    value={form.bannerUrl}
                    onChange={(e) => update("bannerUrl", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    type="url"
                    className={inp}
                  />
                  {form.bannerUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={form.bannerUrl}
                        alt="Banner preview"
                        className="w-full h-24 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SOCIAL LINKS ── */}
          {activeTab === "social" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-1">Social Links</h2>
              <p className="text-sm text-slate-400 mb-5">Connect your social profiles to build trust with customers.</p>

              <div className="space-y-4">
                {[
                  { field: "instagram" as const, label: "Instagram", icon: "📸", prefix: "instagram.com/", placeholder: "yourusername" },
                  { field: "whatsapp"  as const, label: "WhatsApp",  icon: "💬", prefix: "+",              placeholder: "911234567890" },
                  { field: "facebook"  as const, label: "Facebook",  icon: "📘", prefix: "facebook.com/",  placeholder: "yourpage" },
                  { field: "twitter"   as const, label: "Twitter / X", icon: "🐦", prefix: "x.com/",      placeholder: "yourhandle" },
                ].map(({ field, label, icon, prefix, placeholder }) => (
                  <div key={field}>
                    <label className={lbl}>
                      <span className="mr-1.5">{icon}</span>
                      {label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium select-none whitespace-nowrap">
                        {prefix}
                      </span>
                      <input
                        value={form[field]}
                        onChange={(e) => update(field, e.target.value)}
                        placeholder={placeholder}
                        className={`${inp} pl-[${prefix.length * 7 + 14}px]`}
                        style={{ paddingLeft: `${prefix.length * 7 + 14}px` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">💡 Tip</p>
                  <p className="text-xs text-blue-600">
                    For WhatsApp, enter the full number with country code (e.g. 911234567890 for India).
                    Social links help customers reach you directly from your store.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-4">

          {/* Store Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Store Preview</h3>
 
            {/* Mini store card */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
 
              {/* Banner + overlapping logo wrapper */}
              <div className="relative">
                {/* Banner */}
                <div className="h-16 bg-gradient-to-r from-blue-400 to-indigo-500">
                  {form.bannerUrl && (
                    <img
                      src={form.bannerUrl}
                      alt="banner"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
 
                {/* Logo — absolutely positioned to straddle banner bottom */}
                <div className="absolute left-4 -bottom-6 w-12 h-12 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-xl z-10">
                  {form.logoUrl
                    ? <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : "🏪"}
                </div>
              </div>
 
              {/* Info — pt-8 to clear the overlapping logo */}
              <div className="px-4 pt-8 pb-4">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {form.name || "Your Store Name"}
                </p>
                <p className="text-xs text-slate-400 truncate">storly.co.in/{form.username || "yourstore"}</p>
                {form.bio && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{form.bio}</p>
                )}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {form.instagram && <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">📸 IG</span>}
                  {form.whatsapp  && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">💬 WA</span>}
                  {form.facebook  && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">📘 FB</span>}
                  {form.twitter   && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">🐦 X</span>}
                </div>
              </div>
            </div>
 
            <p className="text-[10px] text-slate-400 mt-2.5 text-center">Live preview updates as you type</p>
          </div>
        </div>
      </div>
    </div>
  );
}