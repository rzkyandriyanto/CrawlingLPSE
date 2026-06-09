export type StoredUser = {
  id: string | number;
  perusahaan?: string;
  nama?: string;
  email?: string;
  alamat?: string;
  tag?: string[] | string | null;
  kota?: string;
  provinsi?: string;
  website?: string;
  foto_url?: string;
  search_history?: string[];
};

export type SearchResultItem = {
  id: string | number;
  tipe?: string;
  nama_produk: string; // Used as nama_paket
  ringkasan: string;
  deskripsi: string;
  gambar_url: string;
  kategori: string; // e.g. "Konstruksi", "Barang", "Jasa Konsultansi"
  tag: string;
  wilayah?: string;
  tanggal?: string; // Batas akhir penawaran
  // New LPSE properties
  instansi?: string;
  pagu?: string;
  hps?: string;
  metode_pengadaan?: string;
  // Kept for backward compatibility
  nama_perusahaan?: string;
  harga?: string;
  min_order?: string;
  tentang_perusahaan?: string;
  telepon?: string;
  whatsapp?: string;
  email?: string;
  url_lpse?: string;
  lelangId?: string;
  url_produk?: string;
  jadwal?: any[];
  created_at?: string;
  // Status lifecycle tender
  status?: "aktif" | "gagal" | "selesai" | "menang" | "batal";
  archived_at?: string | null;
  archived_by?: string | null;
  pemenang_nama?: string;
  // Field dari halaman /pengumumanlelang
  kode_rup?: string;
  sumber_dana?: string;
  url_dok_uraian?: string;
  tanggal_pembuatan?: string;
  tahap_saat_ini?: string;
  satuan_kerja?: string;
  jenis_pengadaan?: string;
  tahun_anggaran?: string;
  jenis_kontrak?: string;
  lokasi_pekerjaan?: string;
  kualifikasi_usaha?: string;
  syarat_kualifikasi?: string;
  jumlah_peserta?: number;
  info_synced_at?: string;
  ai_summary?: any;
  relevance_score?: number; // 0-100, digunakan untuk personalisasi urutan tampil
};
