import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { UserModel } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "completed"; // "completed", "failed", "all"

    const parsePagu = (paguStr: string) => {
      if (!paguStr) return 0;
      const numStr = paguStr.replace(/Rp\.?|[^0-9,-]/g, "").replace(/,/g, ".");
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    };

    // ── Query dasar ──
    let baseQuery: any = {};
    if (mode === "completed") {
      baseQuery = { $or: [{ is_deleted: true }, { status: "menang" }, { status: "selesai" }] };
    } else if (mode === "failed") {
      baseQuery = { 
        $or: [
          { status: "gagal" }, 
          { status: "batal" },
          { tahap_saat_ini: { $regex: /batal|gagal|ulang/i } }
        ] 
      };
    } else {
      baseQuery = {};
    }

    // ── 1. Insight Cards: Agregasi di sisi MongoDB ──
    const [
      totalCount,
      statusBreakdown,
      topInstansi,
      topKategori,
      avgPagu,
      tipeBreakdown
    ] = await Promise.all([
      // Total data
      TenderModel.countDocuments(baseQuery),

      // Breakdown status (menang, selesai, aktif, dll)
      TenderModel.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top 5 instansi
      TenderModel.aggregate([
        // Filter instansi yang tidak null/kosong
        { $match: { ...baseQuery, instansi: { $nin: [null, "", "-", "Lainnya"] } } },
        { $group: { _id: "$instansi", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Top 5 bidang/tag (bidang nyata: Konstruksi, IT, Kesehatan, dll)
      TenderModel.aggregate([
        // Filter tag yang tidak null/kosong/"Lainnya"
        { $match: { ...baseQuery, tag: { $nin: [null, "", "-", "Lainnya"] } } },
        { $group: { _id: "$tag", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Rata-rata Pagu (hanya yang pagu_num > 0)
      TenderModel.aggregate([
        { $match: { ...baseQuery, pagu_num: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$pagu_num" }, total: { $sum: "$pagu_num" } } },
      ]),

      // Breakdown Barang vs Jasa (berdasarkan keyword "belanja" di nama_paket)
      TenderModel.aggregate([
        { $match: baseQuery },
        {
          $addFields: {
            isBarang: { $regexMatch: { input: "$nama_paket", regex: /belanja/i } }
          }
        },
        { $group: { _id: { $cond: ["$isBarang", "Barang", "Jasa"] }, count: { $sum: 1 } } }
      ])
    ]);

    const users = await UserModel.find({}, { search_history: 1 }).lean();
    const searchMap: Record<string, number> = {};
    for (const user of users) {
      if ((user as any).search_history) {
        for (const kw of (user as any).search_history) {
          const w = kw.toLowerCase().trim();
          if (w) {
            searchMap[w] = (searchMap[w] || 0) + 1;
          }
        }
      }
    }

    const topKeywords = Object.entries(searchMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([w, c], idx) => ({ keyword: w, count: c, trend: idx % 2 === 0 ? "up" : "down" }));

    const insights = {
      total: totalCount,
      tipeBreakdown: {
        barang: tipeBreakdown.find((t: any) => t._id === "Barang")?.count || 0,
        jasa: tipeBreakdown.find((t: any) => t._id === "Jasa")?.count || 0,
      },
      statusBreakdown: statusBreakdown.map((s: any) => ({
        status: s._id || "tidak diketahui",
        count: s.count,
        pct: totalCount > 0 ? Math.round((s.count / totalCount) * 1000) / 10 : 0, // 1 desimal
      })),
      topInstansi: topInstansi.map((i: any) => ({ nama: i._id || "-", count: i.count })),
      topKategori: topKategori.map((k: any) => ({ nama: k._id || "-", count: k.count })),
      avgPagu: avgPagu[0]?.avg ?? 0,
      totalNilai: avgPagu[0]?.total ?? 0,
      // Hitung konversi selesai (tender yang mencapai tahap akhir)
      totalSelesai: statusBreakdown
        .filter((s: any) => s._id === "selesai" || s._id === "menang")
        .reduce((acc: number, s: any) => acc + s.count, 0),
      topKeywords: topKeywords,
    };

    // ── 2. Daftar data untuk tabel (max 2500) ──
    const tenders = await TenderModel.find(baseQuery)
      .sort({ updatedAt: -1 })
      .limit(2500)
      .lean();

    const parseJadwalDate = (dateStr: string) => {
      if (!dateStr || dateStr === "-") return null;
      const monthMap: Record<string, string> = {
        Januari: "01", Februari: "02", Maret: "03", April: "04",
        Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
        September: "09", Oktober: "10", November: "11", Desember: "12"
      };
      const match = dateStr.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
      if (match) {
        const [, day, monthName, year, time] = match;
        const month = monthMap[monthName] || "01";
        const timeStr = time || "23:59";
        const parsed = new Date(`${year}-${month}-${day.padStart(2, "0")}T${timeStr}:00+07:00`);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    const data = tenders.map((t: any) => {
      const jadwal = Array.isArray(t.jadwal) ? t.jadwal : [];
      let durasi_hari = null;
      let jumlah_reschedule = 0;

      if (jadwal.length > 0) {
        jumlah_reschedule = jadwal.filter((j: any) => j.perubahan && j.perubahan.trim() !== "" && j.perubahan.trim().toLowerCase() !== "tidak ada").length;
        
        const dates = jadwal.flatMap((j: any) => [parseJadwalDate(j.mulai), parseJadwalDate(j.sampai)]).filter((d: any) => d !== null) as Date[];
        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          durasi_hari = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
      id: t._id.toString(),
      lelangId: t.lelangId,
      nama_paket: t.nama_paket,
      instansi: t.instansi,
      kategori: t.kategori,
      status: t.status,
      metode_pengadaan: t.metode_pengadaan,
      pagu: t.pagu,
      hps: t.hps,
        pagu_num: t.pagu_num ?? 0,
        hps_num: t.hps_num ?? 0,
        durasi_hari,
        jumlah_reschedule,
        is_deleted: t.is_deleted ?? false,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
        pemenang_nama: t.pemenang_nama || null,
        pemenang_harga: t.pemenang_harga || null,
        pemenang_harga_num: t.pemenang_harga ? parsePagu(t.pemenang_harga) : 0,
        peserta_evaluasi: t.peserta_evaluasi || null,
      };
    });

    return NextResponse.json({ insights, data }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Analisis Data Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
