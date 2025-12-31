const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/stats.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");

// Chỉ Admin mới được xem thống kê
router.get("/", requireAuth, requireRole("admin"), getDashboardStats);

module.exports = router;