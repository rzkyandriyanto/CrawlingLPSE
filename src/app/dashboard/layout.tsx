"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { useTheme } from "@/components/ThemeProvider";
import Sidebar from "@/components/sidebar/Sidebar";
import DetailModal from "@/components/common/DetailModal";
import AIChatWidget from "@/components/common/AIChatWidget";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    user,
    language,
    pinnedItems,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLogout,
    selectedItem,
    setSelectedItem,
    togglePin,
  } = useDashboard();

  const { isDarkMode, setIsDarkMode } = useTheme();

  // Mobile check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleToggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div
      className="flex min-h-screen font-sans"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── SIDEBAR (DESKTOP) ── */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: isSidebarOpen ? 272 : 72 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="sticky top-0 z-20 h-screen flex flex-col overflow-hidden flex-shrink-0"
          style={{ backgroundColor: "var(--bg-sidebar)" }}
        >
          <Sidebar
            isDarkMode={isDarkMode}
            isMobile={isMobile}
            language={language}
            pinnedItemsCount={pinnedItems.length}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={handleLogout}
            onToggleTheme={handleToggleTheme}
          />
        </motion.aside>
      )}

      {/* ── SIDEBAR (MOBILE DRAWER) ── */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed top-0 left-0 z-50 h-screen w-[272px] flex flex-col shadow-2xl"
              style={{ backgroundColor: "var(--bg-sidebar)" }}
            >
              <Sidebar
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                language={language}
                pinnedItemsCount={pinnedItems.length}
                isOpen={true}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
                onToggleTheme={handleToggleTheme}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE FAB: Open Sidebar ── */}
      <AnimatePresence>
        {isMobile && !isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-2.5 rounded-xl border shadow-lg transition-all"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)",
            }}
            title="Buka Menu"
          >
            <Menu size={20} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 relative z-10 overflow-y-auto w-full min-w-0">
        {children}
      </main>

      {/* ── GLOBAL DETAIL POPUP MODAL ── */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            language={language}
            isPinned={pinnedItems.some((p) => p.id === selectedItem.id)}
            userId={user?.id}
            userName={user?.nama || user?.perusahaan || "Pengguna"}
            onTogglePin={togglePin}
            onStatusUpdate={(tenderId, newStatus) => {
              // Update status di pinnedItems secara optimistik
              // DashboardContext akan di-refresh saat polling berikutnya
              // (tidak perlu action khusus karena polling 3 menit)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── AI CHAT WIDGET ── */}
      <AIChatWidget />
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
