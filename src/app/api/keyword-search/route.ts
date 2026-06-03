import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { ProductModel } from "@/models/Product";
import { UserModel } from "@/models/User";
import { KOTA_PROVINSI_MAP, ADJACENCY_MAP, ISLANDS } from "@/lib/geoMap";

// ─── Fungsi hitung skor relevansi (0-100) ───────────────────────────────────
function calcRelevanceScore(
  tender: any,
  userProfile: { provinsi?: string; topKategori?: string[]; topTags?: string[]; topWilayah?: string[]; topKeywords?: string[]; bidang_minat?: string[] } | null
): number {
  if (!userProfile) return 0;
  let score = 0;
  const wilayah = (tender.wilayah || "").toLowerCase();
  const instansi = (tender.instansi || "").toLowerCase();
  const namaPaket = (tender.nama_paket || "").toLowerCase();
  const kategori = (tender.kategori || "");
  const tagTender = (tender.tag || "");

  // 1. Geografis (Maks +30) - Diturunkan agar perilaku (behavior) bisa lebih mendominasi
  if (userProfile.provinsi) {
    const pUser = userProfile.provinsi.toLowerCase();
    const tenderStr = (wilayah + " " + instansi);
    
    let tenderProv = "";
    for (const [key, val] of Object.entries(KOTA_PROVINSI_MAP)) {
      if (tenderStr.includes(key.toLowerCase())) { tenderProv = val.toLowerCase(); break; }
    }
    
    if (!tenderProv) {
      const allProvinces = Object.keys(ADJACENCY_MAP);
      for (const p of allProvinces) {
        if (tenderStr.includes(p) || (p === "dki jakarta" && tenderStr.includes("jakarta")) || (p === "di yogyakarta" && tenderStr.includes("yogyakarta"))) {
          tenderProv = p; break;
        }
      }
    }

    if (tenderProv) {
      if (tenderProv === pUser) score += 30; // Sama persis
      else if (ADJACENCY_MAP[pUser]?.includes(tenderProv)) score += 15; // Tetangga
      else {
        let userIsland = "", tenderIsland = "";
        for (const [island, provs] of Object.entries(ISLANDS)) {
          if (provs.includes(pUser)) userIsland = island;
          if (provs.includes(tenderProv)) tenderIsland = island;
        }
        if (userIsland && userIsland === tenderIsland) score += 5; // 1 Pulau
      }
    } else {
      if (tenderStr.includes(pUser)) score += 30;
    }
  }

  // 2. Kategori Statis dari Profil & Pin (Maks +20)
  if ((userProfile.topKategori || []).includes(kategori)) score += 10;
  
  if ((userProfile.bidang_minat || []).some((b: string) => 
    kategori.toLowerCase().includes(b.toLowerCase()) || 
    tagTender.toLowerCase().includes(b.toLowerCase()) ||
    namaPaket.includes(b.toLowerCase())
  )) score += 10;

  // 3. TIKTOK-STYLE SENSITIVITY: Top Tags (Spesifik) dari Pin (Maks +20)
  // Jika tender punya Tag (spesifik) yang sering di-pin user
  if (tagTender && (userProfile.topTags || []).includes(tagTender)) {
    score += 20; 
  }

  // 4. TIKTOK-STYLE SENSITIVITY: Cumulative Search History (Maks +45)
  // Setiap kata kunci pencarian yang cocok di judul tender = +15 poin!
  // Jika tender mengandung 3 kata kunci yang baru-baru ini dicari user, langsung dapat 45 poin (super relevan)
  let keywordHits = 0;
  (userProfile.topKeywords || []).forEach((kw: string) => {
    if (kw.length > 2 && namaPaket.includes(kw.toLowerCase())) {
      keywordHits++;
    }
  });
  score += Math.min(keywordHits * 15, 45);

  return Math.min(score, 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, bidang = [], filterWilayah, filterTipe, offset = 0, userId } = body;

    const trimmedKeyword = (keyword || "").trim();
    const targetLpse = filterWilayah || "";
    const tipe = filterTipe || "";

    let items: object[] = [];

    await connectToDatabase();

    // ============================================================
    // QUERY TABEL 1: paket_lelang (Jasa - dari LPSE)
    // ============================================================
    if (tipe === "" || tipe === "Jasa") {
      let query: any = { status: { $nin: ["selesai", "menang"] } };

      if (trimmedKeyword) {
        query.nama_paket = { $regex: trimmedKeyword, $options: "i" };
      }
      if (bidang && bidang.length > 0) {
        // Jika ada bidang, kita harus memadukan query OR dengan filter sebelumnya
        const orConditions = bidang.map((b: string) => ({ nama_paket: { $regex: b, $options: "i" } }));
        if (query.nama_paket) {
           query = { $and: [query, { $or: orConditions }] };
        } else {
           query.$or = orConditions;
        }
      }
      if (targetLpse && targetLpse !== "Semua Instansi (Otomatis)") {
        query.instansi = { $regex: targetLpse.replace("LPSE ", ""), $options: "i" };
      }

      const pipeline: any[] = [
        { $match: query },
        {
          $addFields: {
            tahap_lower: { $toLower: { $ifNull: ["$tahap_saat_ini", ""] } }
          }
        },
        {
          $addFields: {
            tahap_weight: {
              $switch: {
                branches: [
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "prakualifikasi"] }, 0] }, then: 1 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "pengumuman"] }, 0] }, then: 1 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "download"] }, 0] }, then: 2 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "penjelasan"] }, 0] }, then: 3 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "upload"] }, 0] }, then: 4 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "pembukaan"] }, 0] }, then: 5 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "evaluasi"] }, 0] }, then: 6 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "pembuktian"] }, 0] }, then: 7 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "penetapan"] }, 0] }, then: 8 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "sanggah"] }, 0] }, then: 9 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "sppbj"] }, 0] }, then: 10 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "kontrak"] }, 0] }, then: 11 },
                  { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "penandatanganan"] }, 0] }, then: 11 }
                ],
                default: 99
              }
            }
          }
        },
        { $sort: { tahap_weight: 1, createdAt: -1 } },
        { $limit: 1500 } // Ambil lebih banyak item agar daerah user yang tahap_weight-nya rendah tidak terpotong
      ];

      const jasaData = await TenderModel.aggregate(pipeline);

      // ── Ambil profil personalisasi user (jika userId tersedia) ──
      let userProfile: any = null;
      if (userId) {
        try {
          const userDoc = await UserModel.findById(userId)
            .select("provinsi kota bidang_minat search_history")
            .lean() as any;
          if (userDoc) {
            // Hitung top kategori, wilayah, & tag dari tender yang dipin
            const pinnedTenders = await TenderModel.find(
              { pinned_by_users: String(userId) },
              { kategori: 1, wilayah: 1, tag: 1 }
            ).lean();
            const katCount: Record<string, number> = {};
            const wilCount: Record<string, number> = {};
            const tagCount: Record<string, number> = {};
            for (const pt of pinnedTenders) {
              const k = (pt as any).kategori; const w = (pt as any).wilayah; const t = (pt as any).tag;
              if (k) katCount[k] = (katCount[k] || 0) + 1;
              if (w) wilCount[w] = (wilCount[w] || 0) + 1;
              if (t) tagCount[t] = (tagCount[t] || 0) + 1;
            }
            userProfile = {
              provinsi: userDoc.provinsi || "",
              bidang_minat: userDoc.bidang_minat || [],
              topKategori: Object.entries(katCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k),
              topTags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t),
              topWilayah: Object.entries(wilCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w),
              topKeywords: Array.from(new Set([...(userDoc.search_history || [])].reverse())).slice(0, 10),
            };

            // Simpan keyword ke search_history jika ada keyword
            if (trimmedKeyword && trimmedKeyword.length > 1) {
              await UserModel.findByIdAndUpdate(userId, {
                $push: { search_history: { $each: [trimmedKeyword], $slice: -20 } }
              });
            }
          }
        } catch (err) {
          console.warn("[personalization] Gagal ambil profil user:", err);
        }
      }

      const jasaItems = (jasaData || []).map((row: any) => ({
        id: row._id.toString(),
        tipe: "Jasa",
        nama_produk: row.nama_paket || "Paket Pengadaan LPSE",
        deskripsi: "Paket pengadaan pemerintah.",
        ringkasan: "Pengadaan tender LPSE",
        gambar_url: "",
        kategori: row.kategori || "Pekerjaan Konstruksi",
        tag: row.tag || "Konstruksi",
        wilayah: row.wilayah || "Indonesia",
        tanggal: row.tanggal_pembuatan || row.createdAt || "-",
        instansi: row.instansi,
        pagu: row.pagu || "Rp 0",
        hps: row.hps || "Rp 0",
        metode_pengadaan: row.metode_pengadaan || "Tender",
        nama_perusahaan: row.instansi,
        url_lpse: row.url_lpse,
        lelangId: row.lelangId,
        jadwal: row.jadwal,
        ai_summary: row.ai_summary,
        created_at: row.createdAt,
        // Tahap weight sudah dihitung di DB pipeline (untuk sort compound)
        _tahap_weight: row.tahap_weight ?? 99,
        relevance_score: calcRelevanceScore(row, userProfile),
      }));

      items = [...items, ...jasaItems];
    }

    // ============================================================
    // QUERY TABEL 2: produk (Produk - dari Indonetwork)
    // ============================================================
    if (tipe === "" || tipe === "Produk" || tipe === "Jasa") {
      let query: any = {};

      if (trimmedKeyword) {
        query.nama_produk = { $regex: trimmedKeyword, $options: "i" };
      }
      if (bidang && bidang.length > 0) {
        const orConditions = bidang.map((b: string) => ({ tag: b }));
        if (Object.keys(query).length > 0) {
           query = { $and: [query, { $or: orConditions }] };
        } else {
           query.$or = orConditions;
        }
      }

      const produkData = await ProductModel.find(query)
        .sort({ createdAt: -1 })
        .limit(100);

      const mappedProdukItems = (produkData || []).map((row: any) => {
        const nama = (row.nama_produk || "").toLowerCase();
        // Deteksi apakah ini sebenarnya Jasa/Layanan
        const isActuallyJasa = nama.includes("jasa") || nama.includes("sewa") || nama.includes("rental") || nama.includes("service");
        
        let cleanDesc = (row.deskripsi || "").trim();
        if (cleanDesc.toLowerCase().includes("indonetwork")) cleanDesc = "";
        cleanDesc = cleanDesc.replace(/^[-:,.\s]+/, "");
        
        if (!cleanDesc) {
          cleanDesc = row.nama_produk 
            ? `Detail penjelasan dan spesifikasi untuk ${row.nama_produk}.` 
            : (isActuallyJasa ? "Detail jasa belum tersedia." : "Detail produk belum tersedia.");
        }

        return {
          id: row._id.toString(),
          tipe: isActuallyJasa ? "Jasa" : "Produk",
          nama_produk: row.nama_produk || "Produk",
          deskripsi: cleanDesc,
          ringkasan: cleanDesc,
          gambar_url: row.gambar_url || "",
          kategori: isActuallyJasa ? "Layanan & Jasa" : "Produk",
          tag: row.tag || "Umum",
          wilayah: row.kota || "Indonesia",
          tanggal: row.createdAt || "-",
          instansi: row.nama_perusahaan,
          pagu: row.harga || "Hubungi Penjual",
          hps: row.harga || "Hubungi Penjual",
          metode_pengadaan: "-",
          nama_perusahaan: row.nama_perusahaan,
          url_produk: row.url_produk,
          created_at: row.createdAt,
        };
      });

      // Filter berdasarkan tipe yang diminta user
      const filteredProduk = mappedProdukItems.filter(item => {
        if (tipe === "") return true;
        return item.tipe === tipe;
      });

      items = [...items, ...filteredProduk];
    }

    items.sort((a: any, b: any) => {
      const twA = a._tahap_weight ?? 99;
      const twB = b._tahap_weight ?? 99;
      const rsA = a.relevance_score ?? 0;
      const rsB = b.relevance_score ?? 0;

      // Utama: Skor relevansi yang lebih tinggi harus tampil di atas
      if (rsA !== rsB) return rsB - rsA;
      
      // Sekunder: Jika skor relevansi sama, pertahankan hirarki tahap (tahap awal di atas)
      return twA - twB;
    });

    // Hapus field internal sebelum dikirim ke frontend
    const cleanItems = items.map((item: any) => {
      const { _tahap_weight, ...rest } = item;
      return rest;
    });

    // Paginasi: ambil 10 item sesuai offset
    const numOffset = Number(offset) || 0;
    const paginatedItems = cleanItems.slice(numOffset, numOffset + 10);

    return NextResponse.json({ items: paginatedItems });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
    console.error("Search API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
