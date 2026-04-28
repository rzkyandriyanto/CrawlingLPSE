import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, bidang = [], filterWilayah, filterTipe, offset = 0 } = body;

    const trimmedKeyword = (keyword || "").trim();
    const targetLpse = filterWilayah || "";
    // filterTipe: "Produk" | "Jasa" | "" (semua)
    const tipe = filterTipe || "";

    let items: object[] = [];

    // ============================================================
    // QUERY TABEL 1: paket_lelang (Jasa - dari LPSE)
    // ============================================================
    if (tipe === "" || tipe === "Jasa") {
      let qJasa = supabase.from("paket_lelang").select("*");

      if (trimmedKeyword) {
        qJasa = qJasa.ilike("nama_paket", `%${trimmedKeyword}%`);
      }
      if (bidang && bidang.length > 0) {
        const conditions = bidang.flatMap((b: string) => [
          `nama_paket.ilike.%${b}%`,
        ]).join(",");
        qJasa = qJasa.or(conditions);
      }
      if (targetLpse && targetLpse !== "Semua Instansi (Otomatis)") {
        qJasa = qJasa.ilike("instansi", `%${targetLpse.replace("LPSE ", "")}%`);
      }

      qJasa = qJasa.order("created_at", { ascending: false }).range(offset, offset + 9);
      const { data: jasaData } = await qJasa;

      const jasaItems = (jasaData || []).map((row) => ({
        tipe: "Jasa",
        nama_produk: row.nama_paket || "Paket Pengadaan LPSE",
        deskripsi: row.deskripsi || "Paket pengadaan pemerintah.",
        ringkasan: row.ringkasan || "Pengadaan tender LPSE",
        gambar_url: "",
        kategori: row.kategori || "Pekerjaan Konstruksi",
        tag: row.tag || "Konstruksi",
        wilayah: row.wilayah || "Indonesia",
        tanggal: row.tanggal || "-",
        instansi: row.instansi,
        pagu: row.pagu || "Rp 0",
        hps: row.hps || "Rp 0",
        metode_pengadaan: row.metode_pengadaan || "Tender",
        nama_perusahaan: row.instansi,
      }));

      items = [...items, ...jasaItems];
    }

    // ============================================================
    // QUERY TABEL 2: produk (Produk - dari Indonetwork)
    // ============================================================
    if (tipe === "" || tipe === "Produk" || tipe === "Jasa") {
      let qProduk = supabase.from("produk").select("*");

      if (trimmedKeyword) {
        qProduk = qProduk.ilike("nama_produk", `%${trimmedKeyword}%`);
      }
      if (bidang && bidang.length > 0) {
        const tagConditions = bidang.map((b: string) => `tag.eq.${b}`).join(",");
        qProduk = qProduk.or(tagConditions);
      }

      qProduk = qProduk.order("created_at", { ascending: false }).range(offset, offset + 19);
      const { data: produkData } = await qProduk;

      const mappedProdukItems = (produkData || []).map((row) => {
        const nama = (row.nama_produk || "").toLowerCase();
        // Deteksi apakah ini sebenarnya Jasa/Layanan
        const isActuallyJasa = nama.includes("jasa") || nama.includes("sewa") || nama.includes("rental") || nama.includes("service");
        
        // Bersihkan teks boilerplate dari scraper
        let cleanDesc = (row.deskripsi || "").trim();
        if (cleanDesc.toLowerCase().includes("indonetwork")) {
          cleanDesc = "";
        }
        cleanDesc = cleanDesc.replace(/^[-:,.\s]+/, ""); // bersihkan tanda baca sisa di awal
        
        if (!cleanDesc) {
          cleanDesc = row.nama_produk 
            ? `Detail penjelasan dan spesifikasi untuk ${row.nama_produk}.` 
            : (isActuallyJasa ? "Detail jasa belum tersedia." : "Detail produk belum tersedia.");
        }

        return {
          tipe: isActuallyJasa ? "Jasa" : "Produk",
          nama_produk: row.nama_produk || "Produk",
          deskripsi: cleanDesc,
          ringkasan: cleanDesc,
          gambar_url: row.gambar_url || "",
          kategori: isActuallyJasa ? "Layanan & Jasa" : "Produk",
          tag: row.tag || "Umum",
          wilayah: row.kota || "Indonesia",
          tanggal: "-",
          instansi: row.nama_perusahaan,
          pagu: row.harga || "Hubungi Penjual",
          hps: row.harga || "Hubungi Penjual",
          metode_pengadaan: "-",
          nama_perusahaan: row.nama_perusahaan,
          url_produk: row.url_produk,
        };
      });

      // Filter berdasarkan tipe yang diminta user
      const filteredProduk = mappedProdukItems.filter(item => {
        if (tipe === "") return true;
        return item.tipe === tipe;
      });

      items = [...items, ...filteredProduk];
    }

    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
    console.error("Search API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
