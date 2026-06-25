import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { UserModel } from "@/models/User";
import { ReviewModel } from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const tipe = url.searchParams.get("tipe"); // "barang", "jasa", "pengguna"
    const mode = url.searchParams.get("mode") || "completed"; // "completed", "failed", "all"

    // ─────────────────────────────────────────────────────────────────
    // ANALISIS PENGGUNA
    // ─────────────────────────────────────────────────────────────────
    if (tipe === "pengguna") {
      const users = await UserModel.find({}).lean();
      
      const totalUser = users.length;
      
      // Hitung User Aktif Bulan Ini (misal dilihat dari updatedAt atau login terakhir, 
      // tapi asumsikan dari updatedAt >= awal bulan ini)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const activeUsers = users.filter((u: any) => new Date(u.updatedAt || u.createdAt) >= startOfMonth).length;

      // Rating User Overall
      const ratings = await ReviewModel.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ]);
      const avgRating = ratings.length > 0 ? ratings[0].avgRating : 0;

      // Tren pencarian keyword per minggu (dummy tren from history)
      const searchMap: Record<string, number> = {};
      const minatMap: Record<string, number> = {};
      const provMap: Record<string, number> = {};

      for (const user of users) {
        // Keyword Search
        if ((user as any).search_history) {
          for (const kw of (user as any).search_history) {
            const w = kw.toLowerCase().trim();
            if (w) searchMap[w] = (searchMap[w] || 0) + 1;
          }
        }
        
        // Bidang Minat
        if ((user as any).bidang_minat && Array.isArray((user as any).bidang_minat)) {
          for (const bm of (user as any).bidang_minat) {
            if (bm) minatMap[bm] = (minatMap[bm] || 0) + 1;
          }
        } else if ((user as any).tag) {
          const t = (user as any).tag;
          minatMap[t] = (minatMap[t] || 0) + 1;
        }

        // Provinsi
        const prov = (user as any).provinsi || "Tidak Diketahui";
        provMap[prov] = (provMap[prov] || 0) + 1;
      }

      const topKeywords = Object.entries(searchMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([w, c]) => ({ name: w, count: c }));

      const topMinat = Object.entries(minatMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      const topProvinsi = Object.entries(provMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      return NextResponse.json({
        kpi: { totalUser, activeUsers, avgRating },
        chartKeyword: topKeywords,
        chartMinat: topMinat,
        chartProvinsi: topProvinsi,
      }, { status: 200 });
    }

    // ─────────────────────────────────────────────────────────────────
    // ANALISIS BARANG & JASA
    // ─────────────────────────────────────────────────────────────────
    const parsePagu = (paguStr: string) => {
      if (!paguStr) return 0;
      const numStr = paguStr.replace(/Rp\.?|[^0-9,-]/g, "").replace(/,/g, ".");
      const num = parseFloat(numStr);
      return isNaN(num) ? 0 : num;
    };

    let baseQuery: any = { is_deleted: { $ne: true } };
    
    // Tipe filter based on TAG
    if (tipe === "barang") {
      baseQuery.tag = { $in: ["Teknologi", "Kesehatan", "Pendidikan", "Otomotif"] };
    } else if (tipe === "jasa") {
      baseQuery.tag = { $in: ["Konstruksi", "Konsultansi", "Jasa Umum", "Lainnya"] };
    }

    // Mode filter
    if (mode === "completed") {
      baseQuery.$or = [{ is_deleted: true }, { status: "menang" }, { status: "selesai" }];
    } else if (mode === "failed") {
      baseQuery.$or = [
        { status: "gagal" }, 
        { status: "batal" },
        { tahap_saat_ini: { $regex: /batal|gagal|ulang/i } }
      ];
    }

    const [
      totalCount,
      statusBreakdown,
      topInstansi,
      avgPaguResult,
      trendData,
      winRateData
    ] = await Promise.all([
      TenderModel.countDocuments(baseQuery),

      TenderModel.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      TenderModel.aggregate([
        { $match: { ...baseQuery, instansi: { $nin: [null, "", "-", "Lainnya"] } } },
        { $group: { _id: "$instansi", totalPagu: { $sum: "$pagu_num" }, count: { $sum: 1 } } },
        { $sort: { totalPagu: -1 } },
        { $limit: 10 },
      ]),

      TenderModel.aggregate([
        { $match: { ...baseQuery, pagu_num: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$pagu_num" }, total: { $sum: "$pagu_num" } } },
      ]),

      // Line chart: Tren tender per bulan (6 bulan terakhir)
      TenderModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 6 }
      ]),

      // Win Rate per wilayah (hanya untuk JASA, tapi kita query saja jika diminta)
      tipe === "jasa" ? TenderModel.aggregate([
        { $match: { ...baseQuery, wilayah: { $nin: [null, "", "-"] } } },
        {
          $group: {
            _id: "$wilayah",
            total: { $sum: 1 },
            menang: { $sum: { $cond: [{ $in: ["$status", ["menang", "selesai"]] }, 1, 0] } }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]) : Promise.resolve([])
    ]);

    // Format chartTren
    const chartTren = trendData.reverse().map((d: any) => {
      const date = new Date(d._id.year, d._id.month - 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      return {
        name: `${monthName} ${d._id.year}`,
        count: d.count
      };
    });

    // Format chartWinRate
    const chartWinRate = winRateData.map((d: any) => ({
      wilayah: d._id,
      winRate: d.total > 0 ? Math.round((d.menang / d.total) * 100) : 0,
      total: d.total,
      menang: d.menang
    }));

    const kpi = {
      totalTender: totalCount,
      totalNilaiPagu: avgPaguResult[0]?.total ?? 0,
      avgPagu: avgPaguResult[0]?.avg ?? 0,
      jumlahInstansi: topInstansi.length, // approximation or distinct count
    };

    // Calculate exact distinct instansi count for KPI
    if (totalCount > 0) {
      const distinctInstansi = await TenderModel.distinct("instansi", baseQuery);
      kpi.jumlahInstansi = distinctInstansi.length;
    }

    const chartInstansi = topInstansi.map((i: any) => ({
      nama: i._id || "-",
      totalPagu: i.totalPagu,
      count: i.count
    }));

    const chartStatus = statusBreakdown.map((s: any) => ({
      status: s._id || "tidak diketahui",
      count: s.count
    }));

    // Data for Table
    const tenders = await TenderModel.find(baseQuery)
      .sort({ updatedAt: -1 })
      .limit(100) // limit for table
      .select("nama_paket instansi pagu pagu_num status wilayah")
      .lean();

    const tabel = tenders.map((t: any) => ({
      id: t._id.toString(),
      nama_paket: t.nama_paket,
      instansi: t.instansi,
      pagu: t.pagu,
      pagu_num: t.pagu_num,
      status: t.status,
      wilayah: t.wilayah
    }));

    return NextResponse.json({
      kpi,
      chartInstansi,
      chartStatus,
      chartTren,
      chartWinRate,
      tabel
    }, { status: 200 });

  } catch (error: any) {
    console.error("Fetch Analisis Data Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
