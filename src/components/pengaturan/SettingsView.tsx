import { motion } from "framer-motion";
import { Settings, Moon, Sun, Languages } from "lucide-react";

type SettingsViewProps = {
  language: "ID" | "EN";
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  onChangeLanguage: (value: "ID" | "EN") => void;
};

export default function SettingsView({
  language,
  isDarkMode,
  onToggleDarkMode,
  onChangeLanguage,
}: SettingsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="rounded-[2rem] border shadow-sm overflow-hidden p-6 sm:p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Settings size={28} className="text-blue-500" />{" "}
          {language === "EN" ? "Settings" : "Pengaturan"}
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border gap-4 transition-all hover:shadow-md" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                {isDarkMode ? (
                  <Moon size={24} className="text-blue-500" />
                ) : (
                  <Sun size={24} className="text-amber-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  {language === "EN" ? "Dark Mode" : "Mode Gelap"}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {language === "EN"
                    ? "Enable dark theme with deep blue aesthetics."
                    : "Aktifkan tema gelap dengan nuansa biru gelap yang elegan."}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isDarkMode}
                onChange={(e) => onToggleDarkMode(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border gap-4 transition-all hover:shadow-md" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <Languages size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  {language === "EN" ? "Language Preferences" : "Preferensi Bahasa"}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {language === "EN"
                    ? "Select your preferred application language."
                    : "Pilih bahasa aplikasi Anda."}
                </p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as "ID" | "EN")}
              className="rounded-xl px-4 py-3 font-bold outline-none focus:border-[var(--accent)] flex-shrink-0 cursor-pointer border shadow-sm"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
            >
              <option value="ID">Bahasa Indonesia</option>
              <option value="EN">English</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
