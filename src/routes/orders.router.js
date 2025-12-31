const express = require("express");
const router = express.Router();

const { 
  createOrder, 
  getOrderById, 
  listOrders, 
  trackOrder, 
  getOrdersPublic, 
  updateStatus 
} = require("../controllers/orders.controller");

const { createOrderSchema } = require("../schemas/order.dto");
const { requireAuth, requireRole, optionalAuth } = require("../middlewares/auth"); // ✅ 2. Import optionalAuth

const validate = (schema) => (req, _res, next) => { 
  try { 
    req.body = schema.parse(req.body); 
    next(); 
  } catch (e) { 
    e.status = 400; 
    next(e); 
  } 
};

// --- ROUTES ---

// 1. Tạo đơn hàng mới (Có thể không cần đăng nhập)
router.post("/", optionalAuth, validate(createOrderSchema), createOrder);

// 2. Lấy danh sách đơn hàng công khai (Có phân trang)
router.get("/lookup", optionalAuth, getOrdersPublic);

// 3. Tra cứu chi tiết bảo mật (Cho API trackOrder cũ nếu cần)
router.post("/track", trackOrder);

// 4. Danh sách tất cả đơn hàng (Chỉ Admin)
router.get("/", requireAuth, requireRole("admin"), listOrders);

// 5. Lấy chi tiết đơn hàng theo ID
router.get("/:id", getOrderById);

// 6. Cập nhật trạng thái đơn hàng (Chỉ Admin)
router.put("/:id/status", requireAuth, requireRole("admin"), updateStatus);

module.exports = router;