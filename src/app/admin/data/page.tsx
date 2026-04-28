"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Package, ShoppingBag, Search, ExternalLink, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<"jasa" | "produk">("jasa");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    const table = activeTab === "jasa" ? "paket_lelang" : "produk";
    const { data: res } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setData(res || []);
    setLoading(false);
  }

  async function deleteData(id: string) {
    if (!confirm("Hapus data ini secara permanen?")) return;
    
    const table = activeTab === "jasa" ? "paket_lelang" : "produk";
    const { error } = await supabase.from(table).delete().eq("id", id);
    
    if (error) {
      alert("Gagal menghapus: " + error.message);
    } else {
      setData(data.filter(item => item.id !== id));
    }
  }

  const filteredData = data.filter(item => 
    (item.nama_paket || item.nama_produk || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen Data</h1>
          <p className="text-slate-500 mt-1 font-medium">Kelola seluruh database lelang dan produk.</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[1.4rem] shadow-sm border border-slate-200 w-full sm:w-fit">
          <button 
            onClick={() => setActiveTab("jasa")}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2.5 ${activeTab === "jasa" ? "bg-black text-white shadow-lg shadow-black/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
          >
            <Package size={18} strokeWidth={activeTab === "jasa" ? 2.5 : 2} /> Jasa (LPSE)
          </button>
          <button 
            onClick={() => setActiveTab("produk")}
            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2.5 ${activeTab === "produk" ? "bg-black text-white shadow-lg shadow-black/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
          >
            <ShoppingBag size={18} strokeWidth={activeTab === "produk" ? 2.5 : 2} /> Produk
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={`Cari di data ${activeTab === "jasa" ? "paket lelang" : "produk"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-black transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <Filter size={14} /> Total: {filteredData.length} entries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Informasi Item</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Klasifikasi</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Instansi / Vendor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="wait">
              {loading ? (
                <motion.tr initial={{opacity:0}} animate={{opacity:1}} key="loading"><td colSpan={4} className="p-20 text-center text-slate-400 animate-pulse font-bold">Sinkronisasi data database...</td></motion.tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/50 transition-all"
                  >
                    <td className="px-8 py-6 max-w-md">
                      <p className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-black transition-colors">
                        {item.nama_paket || item.nama_produk}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5">
                         <span className="text-[9px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-black uppercase tracking-widest">
                           {item.id.substring(0,8)}
                         </span>
                         {item.url_produk && (
                           <a href={item.url_produk} target="_blank" className="text-blue-500 hover:text-blue-700 font-bold text-[10px] flex items-center gap-1 transition-colors">
                             View Source <ExternalLink size={10} />
                           </a>
                         )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {item.tag || "General"}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold ml-1">{item.kategori || "Tender"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-600 line-clamp-1">{item.instansi || item.nama_perusahaan || "-"}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.kota || "Nasional"}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => deleteData(item.id)}
                        className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr initial={{opacity:0}} animate={{opacity:1}} key="empty"><td colSpan={4} className="p-20 text-center text-slate-400 font-bold">Data kosong atau tidak ditemukan.</td></motion.tr>
              )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
