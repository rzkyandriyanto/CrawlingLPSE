import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  nama_produk: { type: String, required: true },
  deskripsi: String,
  nama_perusahaan: String,
  harga: String,
  gambar_url: String,
  tag: String,
  kategori: String,
  kota: String,
  url_produk: String
}, { timestamps: true });

export const ProductModel = mongoose.models?.Product || mongoose.model("Product", ProductSchema);
