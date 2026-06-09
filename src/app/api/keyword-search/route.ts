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
    const { keyword, bidang = [], filterWilayah, filterTipe, filterStatus, offset = 0, userId } = body;

    const trimmedKeyword = (keyword || "").trim();
    const targetLpse = filterWilayah || "";
    const tipe = filterTipe || "";
    const statusFilter = filterStatus || "Aktif";

    let items: object[] = [];
    let userProfile: any = null;

    await connectToDatabase();

    // ============================================================
    // QUERY TABEL 1: paket_lelang (Jasa - dari LPSE)
    // ============================================================
    if (tipe === "" || tipe === "Jasa" || tipe === "Barang") {
      let query: any = { is_deleted: { $ne: true } };

      if (statusFilter === "Aktif") {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        query.$or = [
          {
            status: { $nin: ["selesai", "menang", "batal", "gagal"] },
            tahap_saat_ini: { $not: /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i }
          },
          {
            status: { $in: ["selesai", "menang", "batal", "gagal"] },
            finished_at: { $gte: threeDaysAgo }
          },
          {
            tahap_saat_ini: { $regex: /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i },
            updatedAt: { $gte: threeDaysAgo }
          }
        ];
      } else if (statusFilter === "Selesai") {
        query.$or = [
          { status: { $in: ["selesai", "menang"] } },
          { tahap_saat_ini: { $regex: /selesai|penunjukan|sppbj|penandatanganan|kontrak/i } }
        ];
      } else if (statusFilter === "Gagal") {
        query.$or = [
          { status: { $in: ["batal", "gagal"] } },
          { tahap_saat_ini: { $regex: /batal|gagal/i } }
        ];
      } else if (statusFilter === "Diulang") {
        query.$or = [
          { status: { $in: ["batal", "gagal"] } },
          { tahap_saat_ini: { $regex: /batal|gagal|ulang/i } },
          { nama_paket: { $regex: /ulang|gagal/i } }
        ];
      }
      // Jika "Semua", tidak ada filter status/tahap yang diterapkan.

      let andConditions: any[] = [];

      if (trimmedKeyword) {
        const queryWords = trimmedKeyword.split(/\s+/).filter(Boolean);
        queryWords.forEach((qw: string) => {
          andConditions.push({ nama_paket: { $regex: qw, $options: "i" } });
        });
      }
      
      if (tipe === "Jasa") {
        andConditions.push({ nama_paket: { $not: /belanja/i } });
      } else if (tipe === "Barang") {
        andConditions.push({ nama_paket: { $regex: /belanja/i } });
      }

      // Menggunakan STRICT FILTER: Hanya data yang cocok dengan bidang user yang akan diambil
      if (bidang && bidang.length > 0) {
        const orConditions: any[] = [];
        bidang.forEach((b: string) => {
          // Hanya filter berdasarkan tag atau kategori, jangan nama_paket agar tidak salah tangkap (false positive)
          orConditions.push({ tag: { $regex: `^${b}$`, $options: "i" } });
          orConditions.push({ tag: { $regex: b, $options: "i" } }); // fallback
          orConditions.push({ kategori: { $regex: b, $options: "i" } });
        });
        andConditions.push({ $or: orConditions });
      }

      if (targetLpse && targetLpse !== "Semua Instansi (Otomatis)") {
        query.instansi = { $regex: targetLpse.replace("LPSE ", ""), $options: "i" };
      }

      if (andConditions.length > 0) {
        query.$and = andConditions;
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
        { $sort: { tahap_weight: 1, createdAt: -1 } }
      ];

      const jasaData = await TenderModel.aggregate(pipeline);

      // ── Ambil profil personalisasi user (jika userId tersedia) ──
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

      const jasaItems = (jasaData || []).map((row: any) => {
        const isProdukModal = (row.nama_paket || "").toLowerCase().includes("belanja");
        return {
        id: row._id.toString(),
        tipe: isProdukModal ? "Barang" : "Jasa",
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
        status: row.status,
        tahap_saat_ini: row.tahap_saat_ini,
        pemenang_nama: row.pemenang_nama,
        // Tahap weight sudah dihitung di DB pipeline (untuk sort compound)
        _tahap_weight: row.tahap_weight ?? 99,
        relevance_score: calcRelevanceScore(row, userProfile),
        };
      });

      items = [...items, ...jasaItems];
    }

    // ============================================================
    // QUERY TABEL 2: produk (Produk - dari Indonetwork)
    // ============================================================
    if (tipe === "" || tipe === "Barang" || tipe === "Jasa") {
      let query: any = {};

      if (trimmedKeyword) {
        const queryWords = trimmedKeyword.split(/\s+/).filter(Boolean);
        if (queryWords.length > 1) {
          if (!query.$and) query.$and = [];
          queryWords.forEach((qw: string) => {
            query.$and.push({ nama_produk: { $regex: qw, $options: "i" } });
          });
        } else {
          query.nama_produk = { $regex: trimmedKeyword, $options: "i" };
        }
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
          tipe: isActuallyJasa ? "Jasa" : "Barang",
          nama_produk: row.nama_produk || "Produk",
          deskripsi: cleanDesc,
          ringkasan: cleanDesc,
          gambar_url: row.gambar_url || "",
          kategori: isActuallyJasa ? "Layanan & Jasa" : "Barang",
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

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    items.sort((a: any, b: any) => {
      const isFinishedA = a.status === "selesai" || a.status === "menang" || a.status === "batal" || a.status === "gagal" || (a.tahap_saat_ini && /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i.test(a.tahap_saat_ini));
      const dateA = a.finished_at ? new Date(a.finished_at) : (a.updatedAt ? new Date(a.updatedAt) : new Date(0));
      const isOldFinishedA = isFinishedA && dateA < threeDaysAgo;

      const isFinishedB = b.status === "selesai" || b.status === "menang" || b.status === "batal" || b.status === "gagal" || (b.tahap_saat_ini && /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i.test(b.tahap_saat_ini));
      const dateB = b.finished_at ? new Date(b.finished_at) : (b.updatedAt ? new Date(b.updatedAt) : new Date(0));
      const isOldFinishedB = isFinishedB && dateB < threeDaysAgo;

      // Prioritas 1: Selesai/Gagal yang umurnya > 3 hari ditaruh di paling bawah
      if (isOldFinishedA && !isOldFinishedB) return 1;
      if (!isOldFinishedA && isOldFinishedB) return -1;

      const twA = a._tahap_weight ?? 99;
      const twB = b._tahap_weight ?? 99;
      const rsA = a.relevance_score ?? 0;
      const rsB = b.relevance_score ?? 0;

      // Prioritas 2: Skor relevansi yang lebih tinggi harus tampil di atas
      if (rsA !== rsB) return rsB - rsA;
      
      // Prioritas 3: Jika skor relevansi sama, pertahankan hirarki tahap (tahap awal di atas)
      return twA - twB;
    });

    // Hapus field internal sebelum dikirim ke frontend
    const cleanItems = items.map((item: any) => {
      const { _tahap_weight, ...rest } = item;
      return rest;
    });

    // Hitung Leaderboard Pemenang (sebelum paginasi)
    const winnerMap: Record<string, { count: number; totalValue: number; tenders: any[] }> = {};
    const lpseMap: Record<string, number> = {};
    
    const parsePagu = (paguStr: string) => {
      if (!paguStr) return 0;
      return Number(paguStr.replace(/Rp/gi, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "")) || 0;
    };

    for (const item of cleanItems) {
      // Hitung LPSE Stats
      const instansi = item.instansi;
      if (instansi && instansi.trim() !== "") {
        const cleanedInstansi = instansi.trim();
        if (!lpseMap[cleanedInstansi]) lpseMap[cleanedInstansi] = 0;
        lpseMap[cleanedInstansi] += 1;
      }

      // Hitung Pemenang
      const w = item.pemenang_nama;
      if (w && w !== "-" && w.trim() !== "") {
        if (!winnerMap[w]) winnerMap[w] = { count: 0, totalValue: 0, tenders: [] };
        winnerMap[w].count += 1;
        winnerMap[w].totalValue += parsePagu(item.pagu);

        if (winnerMap[w].tenders.length < 5) {
          winnerMap[w].tenders.push({
            id: item.id,
            nama_paket: item.nama_produk || item.nama_paket,
            pagu: item.pagu,
            status: item.status || item.tahap_saat_ini
          });
        }
      }
    }

    const keywordMap: Record<string, number> = {};
    const KEYWORDS_UMUM = [
      // Tindakan Umum
      "Pengadaan", "Pembangunan", "Penyediaan", "Peningkatan",
      // Teknologi / IT (bisa barang/jasa)
      "Laptop", "Komputer", "Server", "Jaringan", "Internet", "Software", "Aplikasi", "Sistem", "Informasi", "Website", "CCTV", "Elektronik", "Lisensi", "Langganan", "Digital", "Data", "Multimedia", "Platform", "Hosting", "Hardware", "Perangkat Keras", "Perangkat Lunak", "TIK", "Fiber", "Optik", "Kabel",
      // Konstruksi / Infrastruktur
      "Jalan", "Jembatan", "Gedung", "Sekolah", "Rumah Sakit", "Puskesmas", "Irigasi", "Saluran", "Konstruksi", "Rehabilitasi", "Renovasi", "Pemeliharaan", "Aspal", "Beton", "Paving", "Pagar", "Trotoar", "Drainase", "Sumur", "Bangunan", "Fasilitas", "Taman", "Lampu", "PJU", "Penerangan",
      "Listrik", "Genset", "AC", "Pendingin", "Suku Cadang", "Ban",
      "Pertanian", "Peternakan", "Sampah"
    ];

    const KEYWORDS_BARANG = [
      "Belanja", "Modal", "Barang",
      "Obat", "Obat-obatan", "Alat Kesehatan", "Alkes", "Farmasi", "Medis", "RSUD", "Pasien", "Klinik", "Laboratorium", "Reagen", "Vaksin", "Ambulans",
      "ATK", "Kertas", "Printer", "Fotokopi", "Alat Tulis", "Mebel", "Furniture", "Meja", "Kursi", "Lemari", "Seragam", "Pakaian", "Sepatu", "Tekstil", "Kendaraan", "Mobil", "Motor", "Bus",
      "Catering", "Makanan", "Minuman", "Sembako", "Pupuk", "Benih", "Bibit"
    ];

    const KEYWORDS_JASA = [
      "Jasa", "Konsultansi", "Sewa", "Pembuatan", "Pengembangan", "Penyusunan", "Konsultan",
      "Event Organizer", "Pelatihan", "Bimtek", "Sertifikasi", "Pameran", "Perencanaan", "Pengawasan", "Audit", "Kajian", "Sosialisasi", "Rapat",
      "Keamanan", "Satpam", "Cleaning Service", "Kebersihan"
    ];

    let GOOD_KEYWORDS = [...KEYWORDS_UMUM];
    if (tipe === "Barang") {
      GOOD_KEYWORDS = [...GOOD_KEYWORDS, ...KEYWORDS_BARANG];
    } else if (tipe === "Jasa") {
      GOOD_KEYWORDS = [...GOOD_KEYWORDS, ...KEYWORDS_JASA];
    } else {
      GOOD_KEYWORDS = [...GOOD_KEYWORDS, ...KEYWORDS_BARANG, ...KEYWORDS_JASA];
    }

    for (const item of cleanItems) {
      const nameStr = (item.nama_produk || item.nama_paket || "").toLowerCase();
      // Match against predefined high-quality business keywords
      for (const kw of GOOD_KEYWORDS) {
        if (nameStr.includes(kw.toLowerCase())) {
          keywordMap[kw] = (keywordMap[kw] || 0) + 1;
        }
      }
      // Also add explicit tags if they exist
      if (item.tag && item.tag !== "Lainnya" && item.tag !== "-" && item.tag !== "Umum") {
        const t = item.tag.trim();
        keywordMap[t] = (keywordMap[t] || 0) + 1;
      }
    }
    
    const topKeywords = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([w]) => w);

    
    const leaderboard = Object.entries(winnerMap)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count; // Sort by number of wins first
        }
        return b[1].totalValue - a[1].totalValue; // If tied, sort by total pagu value
      })
      .slice(0, 5) // Top 5
      .map(([name, data]) => ({ name, count: data.count, totalValue: data.totalValue, tenders: data.tenders }));

    const lpseStats = Object.entries(lpseMap)
      .sort((a, b) => b[1] - a[1]) // Sort by count desc
      .map(([name, count]) => ({ name, count }));

    // Hitung Tender Tahap Awal
    let domisiliFilters: string[] = [];
    if (targetLpse && targetLpse !== "Semua Instansi (Otomatis)") {
      domisiliFilters.push(targetLpse.replace("LPSE ", "").toLowerCase());
    } else if (userProfile) {
      if (userProfile.kota) domisiliFilters.push(userProfile.kota.toLowerCase());
      if (userProfile.provinsi) domisiliFilters.push(userProfile.provinsi.toLowerCase());
    }

    const earlyStageTenders = cleanItems
      .filter((item) => {
        const t = (item.tahap_saat_ini || "").toLowerCase();
        const isAwal = t.includes("pengumuman") || t.includes("download") || t.includes("pendaftaran");
        if (!isAwal) return false;

        // Jika user memiliki profil wilayah / memilih target, wajibkan strict match
        if (domisiliFilters.length > 0) {
          const w = (item.wilayah || "").toLowerCase();
          const ins = (item.instansi || "").toLowerCase();
          const matchDomisili = domisiliFilters.some(df => w.includes(df) || ins.includes(df));
          
          // Izinkan tender berskala Nasional (Kementerian, Badan, Lembaga Pusat) menembus filter daerah
          const isNasional = ins.includes("kementerian") || 
                             ins.includes("badan") || 
                             ins.includes("lembaga") || 
                             ins.includes("mabes") || 
                             ins.includes("kepolisian") || 
                             ins.includes("kejaksaan") || 
                             ins.includes("pusat");

          if (!matchDomisili && !isNasional) return false;
        }
        return true;
      })
      .sort((a, b) => parsePagu(b.pagu) - parsePagu(a.pagu));

    // Paginasi: ambil 10 item sesuai offset
    const numOffset = Number(offset) || 0;
    const paginatedItems = cleanItems.slice(numOffset, numOffset + 10);

    return NextResponse.json({ items: paginatedItems, leaderboard, lpseStats, earlyStageTenders, topKeywords });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
    console.error("Search API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
