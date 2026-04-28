"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import Sidebar from "@/components/sidebar/Sidebar";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isDarkMode, language, pinnedItems, isSidebarOpen, setIsSidebarOpen, handleLogout } = useDashboard();
  
  // Mobile check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className={`flex min-h-screen font-sans text-slate-900 override-dark ${isDarkMode ? "dark-theme" : "bg-white"}`}>
      {isDarkMode && (
        <style>{`
          .override-dark, .override-dark main { background-color: #0d1627 !important; color: #f1f5f9 !important; }
          .override-dark .bg-white { background-color: #152238 !important; color: #f8fafc !important; }
          .override-dark .bg-slate-50, .override-dark .bg-slate-50\\/80 { background-color: #1e293b !important; border-color: #334155 !important; }
          .override-dark .bg-amber-50 { background-color: #451a03 !important; border-color: #78350f !important; }
          .override-dark .bg-amber-100 { background-color: #78350f !important; border-color: #78350f !important; }
          .override-dark .text-amber-500 { color: #fef3c7 !important; }
          .override-dark .bg-red-50 { background-color: #450a0a !important; border-color: #7f1d1d !important; }
          .override-dark .bg-slate-100 { background-color: #334155 !important; }
          .override-dark .text-slate-900, .override-dark .text-slate-800 { color: #f8fafc !important; }
          .override-dark .text-slate-700 { color: #cbd5e1 !important; }
          .override-dark .text-slate-600 { color: #94a3b8 !important; }
          .override-dark .text-slate-500 { color: #94a3b8 !important; }
          .override-dark .border-slate-100, .override-dark .border-slate-200, .override-dark .border-b, .override-dark .border-r { border-color: #1e293b !important; }
          .override-dark input, .override-dark select { background-color: #0d1627 !important; color: #f8fafc !important; border-color: #334155 !important; }
          .override-dark .bg-black { background-color: #3b82f6 !important; color: white !important; box-shadow: none !important; }
          .override-dark .border-amber-100 { border-color: #78350f !important; }
          .override-dark header h1 { color: #f8fafc !important; }
          .override-dark h2, .override-dark h3 { color: #f8fafc !important; }
        `}</style>
      )}
      
      {/* --- GRID BACKGROUND --- */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* --- SIDEBAR (DESKTOP) --- */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 288 : 88 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="sticky top-0 relative z-20 h-screen border-r border-white/10 bg-black flex flex-col overflow-hidden"
        >
          <Sidebar
            isDarkMode={isDarkMode}
            isMobile={isMobile}
            language={language}
            pinnedItemsCount={pinnedItems.length}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={handleLogout}
          />
        </motion.aside>
      )}

      {/* --- SIDEBAR (MOBILE) --- */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 z-50 h-screen w-[288px] bg-black border-r border-white/10 flex flex-col shadow-2xl shadow-black"
            >
              <Sidebar
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                language={language}
                pinnedItemsCount={pinnedItems.length}
                isOpen={true}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- FLOATING SIDEBAR TOGGLE (only on mobile when closed) --- */}
      <AnimatePresence>
        {isMobile && !isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-3 sm:p-3.5 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-black rounded-full hover:bg-white transition-all shadow-lg hover:shadow-xl group"
            title="Buka Menu"
          >
            <Menu size={20} strokeWidth={2.5} className="sm:w-[22px] sm:h-[22px] group-hover:scale-110 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <main className={`flex-1 relative z-10 overflow-y-auto w-full transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
