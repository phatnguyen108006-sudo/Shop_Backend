const { Review } = require("../models/review.model");
const { User } = require("../models/user.model");

// 1. Viết đánh giá mới
async function createReview(req, res, next) {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id; // Lấy từ middleware requireAuth
    const newReview = await Review.create({
      productId,
      userId,
      rating,
      comment
    });

    // Populate thông tin người dùng để trả về frontend hiển thị ngay
    await newReview.populate("userId", "name email");

    res.status(201).json({ ok: true, data: newReview });
  } catch (err) {
    next(err);
  }
}

// 2. Lấy danh sách đánh giá của 1 sản phẩm
async function getReviewsByProduct(req, res, next) {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .populate("userId", "name") // Lấy tên người đánh giá
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.json({ ok: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getReviewsByProduct };