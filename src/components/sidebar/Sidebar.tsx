"use client";

import {
  ChevronLeft,
  User,
  LayoutDashboard,
  BookmarkCheck,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Bell,
  BarChart2,
  Database,
  Users,
  ChevronDown,
  ChevronRight,
  Shield
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";

type SubMenuItem = {
  name: string;
  path: string;
  key: string;
};

type SidebarItemType = {
  name: string;
  path?: string;
  icon: any;
  key: string;
  children?: SubMenuItem[];
};

type SidebarProps = {
  isDarkMode: boolean;
  isMobile: boolean;
  language: "ID" | "EN";
  pinnedItemsCount: number;
  isOpen?: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggleTheme: () => void;
};

export default function Sidebar({
  isDarkMode,
  isMobile,
  language,
  pinnedItemsCount,
  isOpen = true,
  onClose,
  onLogout,
  onToggleTheme,
}: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { unreadNotifCount, markNotifAsRead } = useDashboard();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "user");
      } catch {
        setUserRole("user");
      }
    }
  }, []);

  const workspaceItems: SidebarItemType[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { name: language === "EN" ? "Profile" : "Profil", path: "/dashboard/profil", icon: User, key: "profil" },
    { name: language === "EN" ? "Notifications" : "Notifikasi", path: "/dashboard/notifikasi", icon: Bell, key: "notifikasi" },
  ];

  const otherItems: SidebarItemType[] = [
    { name: language === "EN" ? "Saved" : "Tersimpan", path: "/dashboard/tersimpan", icon: BookmarkCheck, key: "tersimpan" },
    { name: language === "EN" ? "Settings" : "Pengaturan", path: "/dashboard/pengaturan", icon: Settings, key: "pengaturan" },
  ];

  if (userRole === "admin") {
    otherItems.push({
      name: "Panel Admin",
      path: "/admin",
      icon: Shield,
      key: "panel-admin"
    });
  }

  // removed adminItems
  const toggleMenu = (key: string) => {
    setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Sidebar colors based on mode using CSS variables
  const sidebarBg = "bg-[var(--bg-sidebar)]";
  const textSidebar = "text-[var(--text-sidebar)]";
  const textSidebarActive = "text-[var(--text-sidebar-active)]";

  const renderMenuItem = (item: SidebarItemType) => {
    const isExpanded = expandedKeys.includes(item.key);
    
    // Check if any child is active
    const hasActiveChild = item.children?.some(child => pathname === child.path) || false;
    const isActive = pathname === item.path || hasActiveChild;

    if (item.children && item.children.length > 0) {
      return (
        <div key={item.key} className="flex flex-col gap-0.5">
          <button
            onClick={() => {
              toggleMenu(item.key);
              if (isMobile && !isOpen) onClose();
            }}
            title={!isOpen ? item.name : undefined}
            className={`icon-animate group flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150 relative ${
              isActive && !isExpanded
                ? `bg-[var(--bg-sidebar-active)] ${textSidebarActive}`
                : `${textSidebar} hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]`
            } ${isOpen ? "w-full justify-start" : "w-11 justify-center mx-auto"}`}
          >
            {isActive && isOpen && !isExpanded && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[var(--accent)]" />
            )}
            <span className="relative flex-shrink-0">
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-150" />
            </span>
            {isOpen && (
              <>
                <span className="flex-1 text-left truncate">{item.name}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </>
            )}
          </button>
          
          {/* Dropdown Content */}
          {isExpanded && isOpen && (
            <div className="flex flex-col gap-0.5 mt-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
              {item.children.map(child => {
                const isChildActive = pathname === child.path;
                return (
                  <Link
                    key={child.key}
                    href={child.path}
                    onClick={() => isMobile && onClose()}
                    className={`group flex items-center py-1.5 pl-10 pr-3 rounded-lg text-xs font-medium transition-all duration-150 relative ${
                      isChildActive
                        ? `text-[var(--accent)] bg-[var(--bg-sidebar-active)]/50`
                        : `${textSidebar} hover:text-[var(--text-sidebar-active)] hover:bg-[var(--bg-sidebar-hover)]`
                    }`}
                  >
                    {isChildActive && (
                      <span className="absolute left-[26px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                    <span className="truncate">{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.path!}
        onClick={() => {
          if (item.key === "notifikasi") markNotifAsRead();
          if (isMobile) onClose();
        }}
        title={!isOpen ? item.name : undefined}
        className={`icon-animate group flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150 relative ${
          isActive
            ? `bg-[var(--bg-sidebar-active)] ${textSidebarActive}`
            : `${textSidebar} hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]`
        } ${isOpen ? "w-full justify-start" : "w-11 justify-center mx-auto"}`}
      >
        {isActive && isOpen && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[var(--accent)]" />
        )}
        <span className="relative flex-shrink-0">
          <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-150" />
          {item.key === "notifikasi" && unreadNotifCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
              style={{ background: "#ef4444", boxShadow: "0 1px 4px rgba(239,68,68,0.5)" }}
            >
              {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
            </span>
          )}
        </span>
        {isOpen && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {item.key === "notifikasi" && unreadNotifCount > 0 && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums text-white"
                style={{ background: "#ef4444" }}
              >
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
            {item.key === "tersimpan" && pinnedItemsCount > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[var(--bg-sidebar-hover)] text-[var(--text-sidebar)]"
                }`}
              >
                {pinnedItemsCount}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={`py-5 flex flex-col h-full ${sidebarBg} ${textSidebar} transition-colors duration-200 ${isOpen ? "w-[272px] px-4" : "w-[72px] px-3"
        }`}
      style={{ borderRight: `1px solid var(--border-sidebar)` }}
    >
      {/* ── Logo / Toggle button ── */}
      <div
        className={`relative flex items-center ${isOpen ? "justify-between pb-4 mb-4 border-b border-slate-800/40 px-2" : "justify-center mb-6 mt-1"
          } w-full`}
        style={isOpen ? { borderColor: "var(--border-sidebar)" } : {}}
      >
        {isOpen ? (
          <>
            <Link
              href="/dashboard"
              onClick={() => isMobile && onClose()}
              className="flex items-center gap-2.5"
            >
              <img
                src="/selenoreverse.png"
                alt="Logo"
                className="h-15 w-auto"
              />
            </Link>
            {!isMobile && (
              <button
                onClick={onClose}
                className={`icon-animate p-2 rounded-lg transition-all duration-200 hover:bg-[var(--bg-sidebar-hover)] ${textSidebar} hover:${textSidebarActive}`}
                title={language === "EN" ? "Collapse Sidebar" : "Ciutkan Sidebar"}
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onClose}
            className={`icon-animate p-2.5 rounded-lg transition-all duration-200 hover:bg-[var(--bg-sidebar-hover)] ${textSidebar} hover:${textSidebarActive}`}
            title={language === "EN" ? "Expand Sidebar" : "Buka Sidebar"}
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Navigation (Sekat-Sekat Group) ── */}
      <nav className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* WORKSPACE GROUP */}
        <div
          className={`flex flex-col gap-0.5 pb-4 ${isOpen ? "border-b border-slate-800/40" : ""}`}
          style={isOpen ? { borderColor: "var(--border-sidebar)" } : {}}
        >
          {isOpen && (
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2 block">
              WORKSPACE
            </span>
          )}
          {workspaceItems.map(renderMenuItem)}
        </div>

        {/* LAINNYA GROUP */}
        <div className="flex flex-col gap-0.5 pb-4">
          {isOpen && (
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2 block">
              LAINNYA
            </span>
          )}
          {otherItems.map(renderMenuItem)}
        </div>
      </nav>

      {/* ── Footer: Theme Toggle + Logout ── */}
      <div
        className="pt-4 mt-4 flex flex-col gap-0.5"
        style={{ borderTop: `1px solid var(--border-sidebar)` }}
      >
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`icon-animate group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${textSidebar} hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)] ${isOpen ? "w-full justify-start" : "w-11 justify-center mx-auto"
            }`}
        >
          {mounted && isDarkMode ? (
            <Sun size={18} strokeWidth={2} className="flex-shrink-0 transition-transform duration-150" />
          ) : (
            <Moon size={18} strokeWidth={2} className="flex-shrink-0 transition-transform duration-150" />
          )}
          {isOpen && (
            <span>{isDarkMode ? (language === "EN" ? "Light Mode" : "Mode Terang") : (language === "EN" ? "Dark Mode" : "Mode Gelap")}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={!isOpen ? (language === "EN" ? "Logout" : "Keluar") : undefined}
          className={`icon-animate group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-[var(--red-text)] hover:bg-[var(--red-subtle)] ${isOpen ? "w-full justify-start" : "w-11 justify-center mx-auto"
            }`}
        >
          <LogOut size={18} strokeWidth={2} className="flex-shrink-0 transition-transform duration-150" />
          {isOpen && <span>{language === "EN" ? "Logout" : "Keluar"}</span>}
        </button>
      </div>
    </div>
  );
}
