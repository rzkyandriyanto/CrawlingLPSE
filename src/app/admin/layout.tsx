"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, Database, LogOut, ChevronRight, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      alert("Akses Ditolak! Anda bukan Admin.");
      router.push("/dashboard");
      return;
    }

    setIsAdmin(true);
  }, [router]);

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Manajemen User", path: "/admin/users", icon: Users },
    { name: "Manajemen Data", path: "/admin/data", icon: Database },
  ];

  if (!isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-4 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 z-40 relative">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <img src="/logologo.png" alt="Logo" className="h-6 invert" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">SELENO</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Control Center</p>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button 
                  key={item.path}
                  onClick={() => router.push(item.path)} 
                  className={`w-full flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    isActive 
                    ? "bg-black text-white shadow-xl shadow-black/10 translate-x-1" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`font-bold text-sm ${isActive ? "opacity-100" : "opacity-80"}`}>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="opacity-50" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => { localStorage.removeItem("currentUser"); router.push("/login"); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all group"
          >
            <div className="p-2 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
              <LogOut size={16} />
            </div>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header for Mobile */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:hidden z-30">
           <img src="/logologo.png" alt="Logo" className="h-6" />
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-lg">
             {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-100/30 blur-[100px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  );
}
