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
};
