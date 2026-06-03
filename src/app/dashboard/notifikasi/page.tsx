"use client";

import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useEffect } from "react";
import { Bell, Sparkles, CalendarClock, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export default function NotifikasiPage() {
  const { notificationsHistory, markNotifAsRead, language } = useDashboard();

  useEffect(() => {
    markNotifAsRead();
  }, []);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
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
        <div className="flex flex-col gap-3">
          {notificationsHistory.map((item, i) => (
            <motion.div
              key={item.id + item.type + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${item.type === "new_tender" ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.2)"}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              {/* Top strip */}
              <div
                className="h-0.5 w-full"
                style={{
                  background: item.type === "new_tender"
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #6366f1, #3b82f6)",
                }}
              />
              <div className="px-4 py-3.5 flex gap-3 items-start">
                {/* Icon */}
                <div
                  className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                  style={{
                    background: item.type === "new_tender"
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "linear-gradient(135deg, #6366f1, #3b82f6)",
                    boxShadow: item.type === "new_tender"
                      ? "0 3px 10px rgba(34,197,94,0.3)"
                      : "0 3px 10px rgba(99,102,241,0.3)",
                  }}
                >
                  {item.type === "new_tender"
                    ? <Sparkles size={15} className="text-white" strokeWidth={2.5} />
                    : <CalendarClock size={15} className="text-white" strokeWidth={2.5} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className="text-[9px] font-extrabold uppercase tracking-widest"
                      style={{ color: item.type === "new_tender" ? "#16a34a" : "#6366f1" }}
                    >
                      {item.type === "new_tender" ? "✦ Tender Relevan Baru" : "⟳ Update Jadwal"}
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {formatTime(item.createdAt || item.updatedAt)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {item.instansi && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>🏛 {item.instansi}</span>
                    )}
                    {item.wilayah && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>📍 {item.wilayah}</span>
                    )}
                    {item.score && (
                      <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                        Kecocokan {item.score}%
                      </span>
                    )}
                    {item.tahap && (
                      <span className="text-xs font-semibold" style={{ color: "#6366f1" }}>
                        Tahap: {item.tahap}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
