const express = require("express");
const router = express.Router();

// 1. Import các hàm xử lý từ Controller (Code logic nằm hết ở đây rồi)
const { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProducts, 
  getProductById 
} = require("../controllers/products.controller");

// 2. Import Middleware
const { requireAuth, requireRole } = require("../middlewares/auth");

// Nếu bạn chưa tạo file dto/validate thì có thể comment 2 dòng này lại để tránh lỗi
// const { createProductSchema, updateProductSchema } = require("../schemas/product.dto");
// const { validate } = require("../middlewares/validate");

// --- ĐỊNH NGHĨA ROUTE ---

// 1. Lấy danh sách sản phẩm (Public + Admin đều dùng)
router.get("/", getProducts);

// 2. Các Route Admin (Cần đăng nhập + quyền admin)
router.post("/", requireAuth, requireRole("admin"), createProduct); 

router.put("/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);
// 3. Lấy chi tiết sản phẩm theo ID (Public)
router.get("/:id", getProductById);

module.exports = router;