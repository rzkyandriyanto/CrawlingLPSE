import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  itemId: { type: String, required: true, index: true }, // ID Tender atau Produk
  itemType: { type: String, enum: ["Tender", "Barang", "Jasa"], required: true },
  userId: { type: String, default: null }, // Bisa null jika guest
  userName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 }, // Optional for replies
  comment: { type: String, required: true },
  parentId: { type: String, default: null }, // To link a reply to a parent review
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  likes: { type: [String], default: [] }, // Array of userIds who liked the review
}, { timestamps: true });

if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

export const ReviewModel = mongoose.model("Review", ReviewSchema);
