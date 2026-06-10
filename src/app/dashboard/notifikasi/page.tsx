"use client";

import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useEffect, useState } from "react";
import { Bell, Sparkles, CalendarClock, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export default function NotifikasiPage() {
  const { notificationsHistory, markNotifAsRead, language, setSelectedItem } = useDashboard();

  useEffect(() => {
    markNotifAsRead();
  }, []);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return language === "EN" ? "Just now" : "Baru saja";
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return language === "EN" ? `${diffInMinutes} mins ago` : `${diffInMinutes} menit yang lalu`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return language === "EN" ? `${diffInHours} hours ago` : `${diffInHours} jam yang lalu`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return language === "EN" ? `${diffInDays} days ago` : `${diffInDays} hari yang lalu`;
    }
    return d.toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleNotifClick = (item: any) => {
    if (item.originalTender) {
      setSelectedItem(item.originalTender as any);
    } else if (item.lelangId || item.url_lpse) {
      setSelectedItem({
        id: item.lelangId || item.id,
        link: item.url_lpse || `https://lpse.lkpp.go.id/eproc4/lelang/${item.lelangId}/pengumumanlelang`,
        lelangId: item.lelangId,
        url_lpse: item.url_lpse || `https://lpse.lkpp.go.id/eproc4/lelang/${item.lelangId}/pengumumanlelang`,
        nama_produk: item.title,
        instansi: item.instansi || "",
        wilayah: item.wilayah || "",
        pagu: item.pagu || "",
        tipe: "Jasa",
        tahap_saat_ini: item.tahap || "",
      } as any);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
          >
            <Bell size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            {language === "EN" ? "Notifications" : "Notifikasi"}
          </h1>
        </div>
        <p className="text-sm ml-12" style={{ color: "var(--text-muted)" }}>
          {language === "EN"
            ? "Relevant new tenders & schedule updates for your pinned tenders."
            : "Tender baru yang relevan & pembaruan jadwal tender yang Anda simpan."}
        </p>
      </div>

      {/* List */}
      {notificationsHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-card-hover)" }}
          >
            <Inbox size={28} style={{ color: "var(--text-muted)" }} strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-sm" style={{ color: "var(--text-muted)" }}>
            {language === "EN" ? "No notifications yet" : "Belum ada notifikasi"}
          </p>
          <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
            {language === "EN"
              ? "Notifications will appear when there are new relevant tenders or updates to your saved tenders."
              : "Notifikasi akan muncul ketika ada tender relevan baru, atau saat ada pembaruan jadwal pada tender yang sudah Anda simpan."}
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const groups: { label: string; items: any[] }[] = [
              { label: language === "EN" ? "Today" : "Hari Ini", items: [] },
              { label: language === "EN" ? "Yesterday" : "Kemarin", items: [] },
              { label: language === "EN" ? "Earlier" : "Sebelumnya", items: [] },
            ];

            notificationsHistory.forEach((item) => {
              const d = new Date(item.createdAt || item.updatedAt || 0);
              d.setHours(0, 0, 0, 0);
              if (d.getTime() === today.getTime()) {
                groups[0].items.push(item);
              } else if (d.getTime() === yesterday.getTime()) {
                groups[1].items.push(item);
              } else {
                groups[2].items.push(item);
              }
            });

            return groups.map((g, gi) => {
              if (g.items.length === 0) return null;
              return (
                <div key={g.label} className="flex flex-col gap-2">
                  <h2 className="text-sm font-bold mt-2 ml-1" style={{ color: "var(--text-primary)" }}>
                    {g.label}
                  </h2>
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                    {g.items.map((item, i) => (
                      <motion.div
                        key={item.id + item.type + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => handleNotifClick(item)}
                        className="cursor-pointer transition-colors border-b last:border-b-0"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <div className="px-4 py-3.5 flex gap-4 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center text-white shadow-sm ${item.type === "new_tender" ? "rounded-xl" : "rounded-full"}`}
                            style={{
                              background: item.type === "new_tender"
                                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                : "linear-gradient(135deg, #6366f1, #3b82f6)"
                            }}
                          >
                            {item.type === "new_tender" ? <Sparkles size={20} /> : <CalendarClock size={20} />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>
                              {item.type === "new_tender" ? (
                                <>
                                  Tender baru relevan untuk Anda: <strong className="font-bold">{item.title}</strong>
                                </>
                              ) : (
                                <>
                                  Jadwal diperbarui untuk: <strong className="font-bold">{item.title}</strong>
                                </>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className="text-[11px] font-bold"
                                style={{ color: item.type === "new_tender" ? "#16a34a" : "#6366f1" }}
                              >
                                {item.type === "new_tender" 
                                  ? (language === "EN" ? `Published: ${formatTime(item.createdAt || item.updatedAt)}` : `Diumumkan: ${formatTime(item.createdAt || item.updatedAt)}`)
                                  : (language === "EN" ? `Updated: ${formatTime(item.createdAt || item.updatedAt)}` : `Diperbarui: ${formatTime(item.createdAt || item.updatedAt)}`)
                                }
                              </span>
                              {item.instansi && (
                                <>
                                  <span className="text-[10px] text-gray-400">•</span>
                                  <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{item.instansi}</span>
                                </>
                              )}
                              {item.score && (
                                <>
                                  <span className="text-[10px] text-gray-400">•</span>
                                  <span className="text-[11px] font-semibold text-green-600">Cocok {item.score}%</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Unread indicator (Optional subtle dot on the right if needed, but we keep it clean for now) */}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
