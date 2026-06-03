"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useTheme } from "@/components/ThemeProvider";
import SettingsView from "@/components/pengaturan/SettingsView";
import { useRouter } from "next/navigation";

export default function PengaturanPage() {
  const { user, language, setLanguage } = useDashboard();
  const { isDarkMode, setIsDarkMode } = useTheme();
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
              {language === 'EN' ? 'Settings' : 'Pengaturan'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {language === 'EN' ? 'Application Settings' : 'Pengaturan Aplikasi'}
            </h1>
            <p className="text-sm sm:text-base font-medium" style={{ color: "var(--text-secondary)" }}>
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
