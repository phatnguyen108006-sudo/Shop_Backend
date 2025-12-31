const express = require("express");
const router = express.Router();
const { createReview, getReviewsByProduct } = require("../controllers/review.controller");
const { requireAuth } = require("../middlewares/auth");

// GET /api/v1/reviews/:productId -> Ai cũng xem được
router.get("/:productId", getReviewsByProduct);

// POST /api/v1/reviews -> Phải đăng nhập mới được viết
router.post("/", requireAuth, createReview);

module.exports = router;