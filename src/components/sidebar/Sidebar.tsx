import { ChevronLeft, X, User, LayoutDashboard, BookmarkCheck, Settings, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

type SidebarProps = {
  isDarkMode: boolean;
  isMobile: boolean;
  language: "ID" | "EN";
  pinnedItemsCount: number;
  isOpen?: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export default function Sidebar({
  isDarkMode,
  isMobile,
  language,
  pinnedItemsCount,
  isOpen = true,
  onClose,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "user");
      } catch (e) {
        setUserRole("user");
      }
    }
  }, []);

  const navItems = [
    { name: language === "EN" ? "Profile" : "Profil", path: "/dashboard/profil", icon: User, key: "profil" },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { name: language === "EN" ? "Saved" : "Tersimpan", path: "/dashboard/tersimpan", icon: BookmarkCheck, key: "tersimpan" },
    { name: language === "EN" ? "Settings" : "Pengaturan", path: "/dashboard/pengaturan", icon: Settings, key: "pengaturan" },
  ];

  // Tambahkan menu Admin jika role-nya adalah admin
  if (userRole === "admin") {
    navItems.push({
      name: "Admin Panel",
      path: "/admin",
      icon: ShieldCheck,
      key: "admin"
    });
  }

  return (
    <div className={`py-6 flex flex-col h-full bg-black text-white transition-all duration-300 ${isOpen ? "w-[288px] px-6" : "w-[88px] px-3"}`}>
      <div className={`relative flex items-center justify-center ${isOpen ? 'mb-4 min-h-[80px]' : 'mb-6 min-h-[40px] mt-2'} w-full`}>
        {isOpen ? (
          <>
            <Link href="/dashboard" onClick={() => isMobile && onClose()}>
              <img
                src="/selenoreverse.png"
                alt="Logo"
                className="h-18 w-auto cursor-pointer"
              />
            </Link>
            {!isMobile && (
              <button
                onClick={onClose}
                className="absolute right-0 p-2.5 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 hover:shadow-md rounded-full transition-all border border-white/10 group"
                title={language === "EN" ? "Close Sidebar" : "Tutup Sidebar"}
              >
                <ChevronLeft
                  size={20}
                  strokeWidth={2.5}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onClose}
            className="p-3 bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 hover:shadow-md rounded-full transition-all border border-white/10"
            title={language === "EN" ? "Open Sidebar" : "Buka Sidebar"}
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.key}
              href={item.path}
              onClick={() => isMobile && onClose()}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${isActive
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "bg-transparent text-slate-400 hover:bg-white/10 hover:text-white"
                } ${isOpen ? "w-full justify-start" : "w-14 justify-center mx-auto"}`}
              title={!isOpen ? item.name : undefined}
            >
              <item.icon size={22} className="flex-shrink-0" />
              {isOpen && <span>{item.name}</span>}
              {isOpen && item.key === "tersimpan" && pinnedItemsCount > 0 && (
                <span
                  className={`ml-auto text-xs font-black px-2.5 py-0.5 rounded-full ${isActive
                    ? "bg-black/10 text-black"
                    : "bg-white/20 text-white"
                    }`}
                >
                  {pinnedItemsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 p-4 text-red-400 font-bold hover:bg-red-500/10 hover:text-red-300 rounded-2xl transition-all ${isOpen ? "w-full justify-start" : "w-14 justify-center mx-auto"}`}
          title={!isOpen ? (language === "EN" ? "Logout" : "Keluar") : undefined}
        >
          <LogOut size={22} className="flex-shrink-0" />
          {isOpen && <span>{language === "EN" ? "Logout" : "Keluar"}</span>}
        </button>
      </div>
    </div>
  );
}
