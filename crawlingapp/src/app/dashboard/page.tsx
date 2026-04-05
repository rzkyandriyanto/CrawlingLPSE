'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) return router.push('/')
    
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchProducts(parsedUser.tag)
  }, [])

  async function fetchProducts(tags: string[]) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        bids (harga)
      `)
      .in('tag', tags)

    if (!error) setProducts(data)
    setLoading(false)
  }

  async function handleBid(productId: string) {
    const input = document.getElementById(`price-${productId}`) as HTMLInputElement
    const harga = parseInt(input.value)

    if (!harga) return alert("Masukkan harga tawaran!")

    const { error } = await supabase
      .from('bids')
      .insert([{ user_id: user.id, product_id: productId, harga }])

    if (error) alert(error.message)
    else {
      alert("Bid harga terendah Anda berhasil dikirim!")
      fetchProducts(user.tag) // Refresh data
    }
  }

  if (loading) return <div className="p-10 text-center">Memuat Dashboard...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-600">CrawlerAuction</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">{user?.perusahaan}</span>
          <button onClick={() => { localStorage.removeItem('user'); router.push('/') }} className="text-red-500 text-sm hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800">Tawaran Aktif</h1>
          <p className="text-slate-500">
            Ditemukan {products.length} permintaan produk sesuai bidang {
                Array.isArray(user?.tag) 
                ? user.tag.join(', ') 
                : user?.tag || 'Umum'
            }.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            // Logika Reverse Auction: Cari harga paling rendah dari array bids
            const lowestPrice = p.bids?.length > 0 
              ? Math.min(...p.bids.map((b: any) => b.harga)) 
              : null;

            return (
              <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase mb-4">
                  {p.tag}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{p.nama_produk}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{p.deskripsi || 'Tidak ada deskripsi.'}</p>
                
                <div className="bg-slate-50 p-4 rounded-xl mb-4">
                  <span className="block text-xs text-slate-400 uppercase font-semibold">Tawaran Terendah</span>
                  <span className="text-2xl font-bold text-green-600">
                    {lowestPrice ? `Rp ${lowestPrice.toLocaleString()}` : 'Belum ada bid'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input 
                    id={`price-${p.id}`}
                    type="number" 
                    placeholder="Masukkan harga"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={() => handleBid(p.id)}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}