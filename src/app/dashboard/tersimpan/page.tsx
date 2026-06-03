"use client";

import { useDashboard } from "../DashboardContext";
import SavedView from "@/components/tersimpan/SavedView";
import { useRouter } from "next/navigation";

export default function TersimpanPage() {
  const { language, pinnedItems, togglePin, removePin } = useDashboard();
  const router = useRouter();

  return (
    <main
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="-mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-7 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 border-b relative z-30 mb-6 sm:mb-8" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)" }}>
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block border border-transparent"
              style={{ color: "var(--accent)", backgroundColor: "var(--accent-subtle)" }}
            >
              {language === 'EN' ? 'Saved' : 'Tersimpan'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {language === 'EN' ? 'Your Saved Items' : 'Daftar Item Tersimpan'}
            </h1>
            <p className="text-sm sm:text-base font-medium" style={{ color: "var(--text-secondary)" }}>
              {language === 'EN' ? 'Access your bookmarked products and services quickly.' : 'Akses produk dan jasa yang telah Anda tandai dengan cepat.'}
            </p>
          </div>
        </header>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        <SavedView
          language={language}
          pinnedItems={pinnedItems}
          onTogglePin={togglePin}
          onRemovePin={removePin}
          onNavigateDashboard={() => router.push("/dashboard")}
        />
      </div>
    </main>
  );
}
