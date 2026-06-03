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
      const since = lastCheckedRef.current || new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/notifications?userId=${user.id}&since=${encodeURIComponent(since)}`);
      if (!res.ok) return;

      const data = await res.json();
      const newItems: NotifItem[] = [
        ...(data.newTenders || []),
        ...(data.pinnedUpdates || []),
      ];

      // Filter item yang sudah pernah kita tampilkan (pakai id)
      const seenStr = localStorage.getItem(`notif_seen_${user.id}`);
      const seen: string[] = seenStr ? JSON.parse(seenStr) : [];
      const fresh = newItems.filter(item => !seen.includes(item.id + item.type));

      if (fresh.length > 0) {
        // Tambahkan ke history dan queue popup
        setNotificationsHistory(prev => [...fresh, ...prev].slice(0, 50));
        setUnreadNotifCount(prev => prev + fresh.length);
        setNotifQueue(prev => [...prev, ...fresh]);
        notifQueueRef.current = [...notifQueueRef.current, ...fresh];

        // Tandai sebagai sudah pernah dilihat agar tidak muncul lagi
        const newSeen = [...seen, ...fresh.map(f => f.id + f.type)].slice(-200);
        localStorage.setItem(`notif_seen_${user.id}`, JSON.stringify(newSeen));
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
            key={notification.id + notification.type}
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, y: 30 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-[340px] w-full overflow-hidden"
            style={{
              borderRadius: "20px",
              background: notification.type === "new_tender"
                ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.98) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.98) 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              backdropFilter: "blur(20px)",
              border: notification.type === "new_tender"
                ? "1px solid rgba(134,239,172,0.4)"
                : "1px solid rgba(147,197,253,0.4)",
            }}
          >
            {/* Coloured top strip - WhatsApp style */}
            <div
              className="h-1 w-full"
              style={{
                background: notification.type === "new_tender"
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : "linear-gradient(90deg, #3b82f6, #6366f1)",
              }}
            />
            <div className="px-4 pt-3 pb-4 flex gap-3 items-start">
              {/* Icon bubble */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  background: notification.type === "new_tender"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  boxShadow: notification.type === "new_tender"
                    ? "0 4px 12px rgba(34,197,94,0.35)"
                    : "0 4px 12px rgba(59,130,246,0.35)",
                }}
              >
                {notification.type === "new_tender"
                  ? <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                  : <CalendarClock size={18} className="text-white" strokeWidth={2.5} />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: notification.type === "new_tender" ? "#16a34a" : "#3b82f6" }}
                    >
                      {notification.type === "new_tender" ? "✦ Tender Relevan Baru" : "⟳ Update Jadwal Tender"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug mt-0.5 line-clamp-2" style={{ letterSpacing: "-0.01em" }}>
                      {notification.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setNotification(null)}
                    className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >
                    <X size={12} className="text-slate-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="mt-1.5 space-y-0.5">
                  {notification.type === "new_tender" ? (
                    <>
                      {notification.instansi && (
                        <p className="text-xs text-slate-500 truncate">🏛 {notification.instansi}</p>
                      )}
                      {notification.wilayah && (
                        <p className="text-xs text-slate-500 truncate">📍 {notification.wilayah}</p>
                      )}
                      {notification.score && (
                        <p className="text-xs font-semibold" style={{ color: "#16a34a" }}>Kecocokan {notification.score}%</p>
                      )}
                    </>
                  ) : (
                    <>
                      {notification.instansi && (
                        <p className="text-xs text-slate-500 truncate">🏛 {notification.instansi}</p>
                      )}
                      {notification.tahap && (
                        <p className="text-xs font-semibold" style={{ color: "#3b82f6" }}>Tahap: {notification.tahap}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Timestamp */}
                <div className="mt-2 flex items-center gap-1.5">
                  <Bell size={9} className="text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selenoprojek Notifikasi</span>
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
