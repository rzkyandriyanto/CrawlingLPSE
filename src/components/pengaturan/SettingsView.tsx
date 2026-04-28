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
      <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-900">
          <Settings size={28} className="text-blue-500" />{" "}
          {language === "EN" ? "Settings" : "Pengaturan"}
        </h2>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 rounded-2xl border border-slate-100 gap-4 transition-all hover:border-blue-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                {isDarkMode ? (
                  <Moon size={24} className="text-blue-500" />
                ) : (
                  <Sun size={24} className="text-amber-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {language === "EN" ? "Dark Mode" : "Mode Gelap"}
                </h3>
                <p className="text-sm text-slate-500">
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
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 rounded-2xl border border-slate-100 gap-4 transition-all hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                <Languages size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {language === "EN" ? "Language Preferences" : "Preferensi Bahasa"}
                </h3>
                <p className="text-sm text-slate-500">
                  {language === "EN"
                    ? "Select your preferred application language."
                    : "Pilih bahasa aplikasi Anda."}
                </p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as "ID" | "EN")}
              className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-bold outline-none focus:border-black flex-shrink-0 cursor-pointer shadow-sm"
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
