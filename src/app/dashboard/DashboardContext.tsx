"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StoredUser, SearchResultItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, CalendarClock, Sparkles } from "lucide-react";

type NotifItem = {
  id: string;
  type: "new_tender" | "schedule_update";
  title: string;
  instansi?: string;
  wilayah?: string;
  pagu?: string;
  score?: number;
  tahap?: string;
  lelangId?: string;
  url_lpse?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DashboardContextType = {
  user: StoredUser | null;
  setUser: React.Dispatch<React.SetStateAction<StoredUser | null>>;
  language: "ID" | "EN";
  setLanguage: (lang: "ID" | "EN") => void;
  pinnedItems: SearchResultItem[];
  togglePin: (item: SearchResultItem) => void;
  removePin: (item: SearchResultItem) => void;
  isItemPinned: (item: SearchResultItem) => boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  selectedItem: SearchResultItem | null;
  setSelectedItem: (item: SearchResultItem | null) => void;
  filterTipe: string;
  setFilterTipe: (val: string) => void;
  handleLogout: () => void;
  unreadNotifCount: number;
  notificationsHistory: NotifItem[];
  markNotifAsRead: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [language, setLanguage] = useState<"ID" | "EN">("ID");
  const [pinnedItems, setPinnedItems] = useState<SearchResultItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [filterTipe, setFilterTipe] = useState("Barang");
  const [notification, setNotification] = useState<NotifItem | null>(null);
  const [notifQueue, setNotifQueue] = useState<NotifItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notificationsHistory, setNotificationsHistory] = useState<NotifItem[]>([]);
  const notifQueueRef = useRef<NotifItem[]>([]);
  const lastCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    // Check language and selected item
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("language");
      if (storedLang === "EN") setLanguage("EN");
      
      const storedItem = sessionStorage.getItem("selectedItem");
      if (storedItem) {
        try {
          setSelectedItem(JSON.parse(storedItem));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
  }, [language]);

  // Persist selected item to survive page reloads
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedItem) {
        sessionStorage.setItem("selectedItem", JSON.stringify(selectedItem));
      } else {
        sessionStorage.removeItem("selectedItem");
      }
    }
  }, [selectedItem]);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        router.push("/login");
        return;
      }
      try {
        const p = JSON.parse(stored) as StoredUser;
        setUser(p);
      } catch {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  // ── Draining notification queue: show one by one with 5s gap ──────────────
  useEffect(() => {
    if (notifQueue.length === 0 || notification) return;
    const next = notifQueue[0];
    setNotification(next);
    setNotifQueue(prev => prev.slice(1));
    const timer = setTimeout(() => setNotification(null), 7000);
    return () => clearTimeout(timer);
  }, [notifQueue, notification]);

  // ── Fetch pinned items from DB ─────────────────────────────────────────────
  const fetchPinnedTenders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/tenders/pinned?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPinnedItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch pinned tenders", err);
    }
    fetch("/api/tenders/auto-cleanup").catch(() => {});
  };

  // ── Fetch notifications (new relevant tenders + pinned schedule updates) ──
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const since = lastCheckedRef.current || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/notifications?userId=${user.id}&since=${encodeURIComponent(since)}`);
      if (!res.ok) return;

      const data = await res.json();
      const newItems: NotifItem[] = [
        ...(data.newTenders || []),
        ...(data.pinnedUpdates || []),
      ];

      if (newItems.length > 0) {
        setNotificationsHistory(prev => {
          const combined = [...newItems, ...prev];
          const unique = combined.filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.type === v.type)) === i);
          return unique.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime()).slice(0, 100);
        });

        const seenStr = localStorage.getItem(`notif_seen_${user.id}`);
        const seen: string[] = seenStr ? JSON.parse(seenStr) : [];
        const fresh = newItems.filter(item => !seen.includes(item.id + item.type));

        if (fresh.length > 0) {
          setUnreadNotifCount(prev => prev + fresh.length);
          setNotifQueue(prev => [...prev, ...fresh]);
          notifQueueRef.current = [...notifQueueRef.current, ...fresh];

          const newSeen = [...seen, ...fresh.map(f => f.id + f.type)].slice(-500);
          localStorage.setItem(`notif_seen_${user.id}`, JSON.stringify(newSeen));
        }
      }

      lastCheckedRef.current = new Date().toISOString();
    } catch (err) {
      console.error("[notifications] Gagal fetch:", err);
    }
  };

  const markNotifAsRead = () => setUnreadNotifCount(0);

  useEffect(() => {
    if (user) {
      fetchPinnedTenders();
      fetchNotifications();

      const pinnedInterval = setInterval(fetchPinnedTenders, 3 * 60 * 1000);
      const notifInterval = setInterval(fetchNotifications, 60 * 1000); // Setiap 60 detik

      return () => {
        clearInterval(pinnedInterval);
        clearInterval(notifInterval);
      };
    }
  }, [user]);

  const togglePin = async (item: SearchResultItem) => {
    if (!user) return;
    
    const isExist = pinnedItems.find((p) => p.id === item.id);
    const action = isExist ? "unpin" : "pin";
    
    // Optimistic UI update
    setPinnedItems((prev) => {
      if (isExist) {
        return prev.filter((p) => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });

    try {
      await fetch("/api/tenders/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, tenderId: item.id, action })
      });
    } catch (err) {
      console.error("Failed to pin/unpin", err);
      // Revert if error? (Optional, skipping for now)
    }
  };

  const removePin = async (item: SearchResultItem) => {
    if (!user) return;
    
    setPinnedItems((prev) => prev.filter((p) => p.id !== item.id));
    
    try {
      await fetch("/api/tenders/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, tenderId: item.id, action: "unpin" })
      });
    } catch (err) {
      console.error("Failed to remove pin", err);
    }
  };

  const isItemPinned = (item: SearchResultItem) => {
    return pinnedItems.some((p) => p.id === item.id);
  };

  const handleLogout = async () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        pinnedItems,
        togglePin,
        removePin,
        isItemPinned,
        isSidebarOpen,
        setIsSidebarOpen,
        selectedItem,
        setSelectedItem,
        filterTipe,
        setFilterTipe,
        handleLogout,
        unreadNotifCount,
        notificationsHistory,
        markNotifAsRead,
      }}
    >
      {children}

      {/* WhatsApp iOS-style Notification Popup */}
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="fixed bottom-6 right-6 z-[9999] max-w-[340px] w-full cursor-pointer rounded-2xl overflow-hidden shadow-xl"
            onClick={() => {
              if (notification.lelangId || notification.url_lpse) {
                setSelectedItem({
                  id: notification.lelangId || notification.id,
                  link: notification.url_lpse || `https://lpse.lkpp.go.id/eproc4/lelang/${notification.lelangId}/pengumumanlelang`,
                  lelangId: notification.lelangId,
                  url_lpse: notification.url_lpse || `https://lpse.lkpp.go.id/eproc4/lelang/${notification.lelangId}/pengumumanlelang`,
                  nama_produk: notification.title,
                  instansi: notification.instansi || "",
                  wilayah: notification.wilayah || "",
                  pagu: notification.pagu || "",
                  tipe: "Jasa",
                  tahap_saat_ini: notification.tahap || "",
                } as any);
                setNotification(null); // dismiss popup
              }
            }}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-primary)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)"
            }}
          >
            <div className="px-4 py-3.5 flex gap-4 items-start relative hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {/* Close Button placed absolutely in top right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotification(null);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={12} style={{ color: "var(--text-muted)" }} />
              </button>

              {/* Icon */}
              <div
                className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-sm mt-0.5"
                style={{
                  background: notification.type === "new_tender"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #6366f1, #3b82f6)"
                }}
              >
                {notification.type === "new_tender" ? <Sparkles size={20} /> : <CalendarClock size={20} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[13px] leading-snug line-clamp-3" style={{ color: "var(--text-primary)" }}>
                  {notification.type === "new_tender" ? (
                    <>
                      Tender baru relevan untuk Anda: <strong className="font-bold">{notification.title}</strong>
                    </>
                  ) : (
                    <>
                      Jadwal diperbarui untuk: <strong className="font-bold">{notification.title}</strong>
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: notification.type === "new_tender" ? "#16a34a" : "#6366f1" }}
                  >
                    Baru saja
                  </span>
                  {notification.instansi && (
                    <>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[11px] truncate max-w-[120px]" style={{ color: "var(--text-muted)" }}>{notification.instansi}</span>
                    </>
                  )}
                  {notification.score && (
                    <>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[11px] font-semibold text-green-600">Cocok {notification.score}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
