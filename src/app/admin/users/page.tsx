"use client";
import { useEffect, useState } from "react";
// supabase import removed
import { Trash2, Mail, Building2, Shield, Search, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const { users, error } = await res.json();
      if (!res.ok) throw new Error(error);
      setUsers(users || []);
    } catch (err: any) {
      alert("Gagal memuat pengguna: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string, email: string) {
    if (email === "admin@seleno.id") {
      alert("Tidak bisa menghapus Admin Utama!");
      return;
    }

    if (!confirm(`Hapus user ${email}? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      const { error } = await res.json();
      if (!res.ok) throw new Error(error);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  }

  const filteredUsers = users.filter(u => 
    (u.perusahaan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen User</h1>
          <p className="text-slate-500 mt-1 font-medium">Kelola database pengguna sistem Seleno.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari user atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3.5 rounded-[1.2rem] border-2 border-slate-100 bg-white outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all text-sm w-full sm:w-80 shadow-sm"
          />
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Pengguna & Perusahaan</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Bidang Utama</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Hak Akses</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 animate-pulse font-bold">Memuat database pengguna...</td></tr>
              ) : filteredUsers.length > 0 ? (
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="group hover:bg-slate-50/50 transition-all"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[1rem] flex items-center justify-center font-black text-slate-500 shadow-inner group-hover:scale-105 transition-transform">
                            {user.perusahaan?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base">{user.perusahaan || "Tanpa Nama"}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                              <Mail size={12} className="opacity-70" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1">
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-200/50">
                             {user.tag || "Semua Bidang"}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'admin' 
                          ? 'bg-slate-900 text-white shadow-lg shadow-black/10' 
                          : 'bg-white border border-slate-200 text-slate-500'
                        }`}>
                          {user.role === 'admin' && <Shield size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => deleteUser(user.id, user.email)}
                             className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                             title="Hapus Pengguna"
                           >
                             <Trash2 size={18} strokeWidth={2.5} />
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">Tidak ada pengguna yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
