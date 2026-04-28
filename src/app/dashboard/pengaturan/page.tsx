"use client";

import { useDashboard } from "../DashboardContext";
import SettingsView from "@/components/pengaturan/SettingsView";
import { useRouter } from "next/navigation";

export default function PengaturanPage() {
  const { user, language, isDarkMode, setIsDarkMode, setLanguage } = useDashboard();
  const router = useRouter();

  return (
    <main className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto">
      <div className="bg-white -mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-7 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 border-b border-slate-100 shadow-sm relative z-30 mb-6 sm:mb-8">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
              {language === 'EN' ? 'Settings' : 'Pengaturan'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 text-black flex items-center gap-2">
              {language === 'EN' ? 'Application Settings' : 'Pengaturan Aplikasi'}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              {language === 'EN' ? 'Customize your dashboard experience.' : 'Sesuaikan pengalaman dashboard Anda.'}
            </p>
          </div>
        </header>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <SettingsView
          language={language}
          isDarkMode={isDarkMode}
          onToggleDarkMode={setIsDarkMode}
          onChangeLanguage={setLanguage}
        />
      </div>
    </main>
  );
}
