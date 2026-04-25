// src/pages/Store/UserProfiles.tsx

import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import type { Store } from "../../types/store";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function UserProfiles() {
  const navigate = useNavigate();
  const { user, stores, authStatus } = useAppStore();

  // useAuth / bootstrap already handles redirect to /signin if unauthenticated.
  // We just need a loading state for the brief moment before bootstrap completes.
  if (authStatus === "loading" || authStatus === "idle") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-sm">Failed to load profile.</p>
      </div>
    );
  }

  const roleLabel =
    user.roles?.map((r) => r.name.replace("ROLE_", "")).join(", ") || "User";

  return (
    <div className="p-4">
      <PageMeta
        title="User Profile | Storly Dashboard"
        description="View and manage your Storly user profile"
      />
      <PageBreadcrumb pageTitle="User Profile" />

      <div className="space-y-5">
        {/* ── Identity Card ── */}
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-semibold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {roleLabel}
                </span>
                {user.enable && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                )}
                {user.onBoard && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Onboarded
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Member since {formatDate(user.createdDate)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Info + Stores two-column ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contact Info */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">
              Contact information
            </h3>
            <div className="space-y-0">
              <InfoRow label="Full name"       value={user.name} />
              <InfoRow label="Username"        value={`@${user.username}`} />
              <InfoRow label="Email"           value={user.email} />
              <InfoRow label="Mobile"          value={user.mobile} />
              {user.gender && <InfoRow label="Gender" value={user.gender} />}
              <InfoRow
                label="Biometric login"
                value={user.biometric ? "Enabled" : "Disabled"}
                valueClass={user.biometric ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}
              />
            </div>
          </div>

          {/* Stores */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Your stores
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {stores.length}
                </span>
              </h3>
              <button
                onClick={() => navigate("/store/create-store")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                + New store
              </button>
            </div>
            <div className="space-y-3">
              {stores.map((store: Store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onManage={() =>
                    navigate("/store/store-profile", { state: { storeUsername: store.username } })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-right break-all ${valueClass ?? "text-gray-900 dark:text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function StoreCard({ store, onManage }: { store: Store; onManage: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
        {store.logoUrl ? (
          <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
            {store.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{store.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">storly.co.in/{store.username}</p>
      </div>
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 hidden sm:block">
        {store.theme?.replace(/_/g, " ")}
      </span>
      <button
        onClick={onManage}
        className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
      >
        Manage
      </button>
    </div>
  );
}