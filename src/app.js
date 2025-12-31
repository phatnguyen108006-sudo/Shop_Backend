const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const productsRouter = require("./routes/products.router");
const ordersRouter = require("./routes/orders.router");
const authRouter = require("./routes/auth.router");
const customersRouter = require("./routes/customers.router");
const statsRouter = require("./routes/stats.router");
const reviewsRouter = require("./routes/reviews.router");
// ===== APP CONFIG =====
const app = express();
app.set("trust proxy", 1); // Cần thiết khi deploy

// ===== MIDDLEWARE =====
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Cho phép load ảnh/static
}));

// CORS Setup
app.use(cors({
  origin: [
    "http://localhost:3000",               // Cho phép máy tính cá nhân
    "https://btck-shop.vercel.app",        // Cho phép Frontend trên Vercel (Thay đúng link của bạn)
    process.env.CORS_ORIGIN                // Cho phép thêm từ biến môi trường (nếu có)
  ].filter(Boolean),                       // Lọc bỏ giá trị rỗng
  credentials: true,
}));

// Body Parser & Logger
app.use(express.json({ limit: "10kb" })); // Chống spam payload lớn
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ===== ROUTING SYSTEM (V1) =====
const apiV1 = express.Router();

// Health Check
apiV1.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "BTCK-api",
    version: "v1",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Gắn các route con vào router V1
// (Lưu ý: Không cần thêm /api/v1 ở đây nữa vì đã mount ở dưới)
apiV1.use("/auth", authRouter);       // -> /api/v1/auth
apiV1.use("/products", productsRouter); // -> /api/v1/products
apiV1.use("/orders", ordersRouter);     // -> /api/v1/orders
apiV1.use("/stats", statsRouter);  // -> /api/v1/stats
apiV1.use("/customers", customersRouter);  // -> /api/v1/customers
apiV1.use("/reviews", reviewsRouter); // -> /api/v1/reviews
// Kích hoạt toàn bộ Router V1
app.use("/api/v1", apiV1);

// ===== ROOT ROUTE =====
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "BTCK-api",
    tip: "Check health at /api/v1/health",
    version: "v1",
  });
});

// ===== ERROR HANDLING =====

// 404 Not Found (Chạy khi không route nào khớp)
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: { 
      code: "NOT_FOUND", 
      message: "Route not found", 
      path: req.originalUrl 
    },
  });
});

// Global Error Handler (Xử lý lỗi tập trung)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  
  const status = err.status || 500;
  const code = err.code || (status === 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR");
  const message = err.message || "Internal Server Error";
  
  // Log lỗi ra console nếu không phải production để debug
  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", status, code, message, err.stack);
  }
  
  res.status(status).json({ 
    ok: false, 
    error: { code, message } 
  });
});

module.exports = app;