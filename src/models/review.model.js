const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người đánh giá
    rating: { type: Number, required: true, min: 1, max: 5 }, // 1 đến 5 sao
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = { Review: mongoose.model("Review", reviewSchema) };