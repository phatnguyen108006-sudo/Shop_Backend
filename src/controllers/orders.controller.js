const { isValidObjectId } = require("mongoose");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { calcTotals } = require("../lib/checkout");

// 1. TẠO ĐƠN HÀNG
async function createOrder(req, res, next) {
  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;

    // 👇 [MỚI] Lấy userId nếu người dùng đã đăng nhập (req.user có được từ middleware optionalAuth)
    const userId = req.user ? req.user._id : null;

    const snapshot = [];

    for (const it of items) {
      let p = null;
      if (isValidObjectId(it.productId)) {
        p = await Product.findById(it.productId).lean();
      } else {
        p = await Product.findOne({ slug: it.productId }).lean();
      }

      if (!p) return res.status(404).json({ ok: false, error: { code: "PRODUCT_NOT_FOUND", message: String(it.productId) } });
      if ((p.stock ?? 0) < it.quantity) return res.status(400).json({ ok: false, error: { code: "OUT_OF_STOCK", message: p.title } });

      snapshot.push({ productId: p._id, title: p.title, price: p.price, quantity: it.quantity, image: p.images?.[0] });
    }

    const totals = calcTotals(snapshot, customerAddress);

    const order = await Order.create({
      userId, // 👇 [MỚI] Lưu ID người dùng vào đơn hàng
      items: snapshot,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      total: totals.total,
      customerName, customerPhone, customerAddress, paymentMethod, note,
      status: "pending",
    });

    return res.status(201).json({ ok: true, order: order.toJSON() });
  } catch (err) { next(err); }
}

// 2. LẤY CHI TIẾT ĐƠN HÀNG (Admin/User)
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, error: { code: "BAD_ID", message: "Invalid order id" } });
    
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Order not found" } });
    
    return res.json({ ok: true, data: order }); 
  } catch (err) { next(err); }
}

// 3. DANH SÁCH ĐƠN HÀNG (Admin)
async function listOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const qPhone = (req.query.phone || "").trim();
    const qStatus = (req.query.status || "").trim();

    const cond = {};
    if (qPhone) cond.customerPhone = new RegExp(qPhone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (qStatus) cond.status = qStatus;

    const [data, total] = await Promise.all([
      Order.find(cond).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(cond)
    ]);

    return res.json({ ok: true, data, page, limit, total, hasNext: page * limit < total });
  } catch (err) { next(err); }
}

// 4. [ĐÃ SỬA] TRA CỨU ĐƠN HÀNG (Tự động theo User hoặc SĐT)
// Hàm này thay thế cho getOrdersByPhone cũ
async function getOrdersPublic(req, res, next) {
  try {
    const { phone } = req.query; 
    
    // 👇 Logic xử lý:
    // 1. Nếu đã đăng nhập (có req.user) -> Lấy theo userId
    // 2. Nếu chưa đăng nhập -> Lấy theo phone trên URL
    
    const userId = req.user ? req.user._id : null;
    let filter = {};

    if (userId) {
      // Trường hợp 1: Đã Login
      filter.userId = userId;
    } else if (phone) {
      // Trường hợp 2: Khách vãng lai nhập SĐT
      filter.customerPhone = phone.trim();
    } else {
      // Không có thông tin gì -> Trả về rỗng
      return res.json({ ok: true, data: [] });
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    
    return res.json({ ok: true, data: orders });
  } catch (err) {
    next(err);
  }
}

// 5. TRA CỨU BẢO MẬT (Chi tiết 1 đơn cụ thể)
async function trackOrder(req, res, next) {
  try {
    const { orderId, phone } = req.body; 

    if (!orderId || !phone) {
      return res.status(400).json({ ok: false, error: { message: "Thiếu thông tin tra cứu" } });
    }

    if (!isValidObjectId(orderId)) {
        return res.status(404).json({ ok: false, error: { message: "Không tìm thấy đơn hàng" } });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ ok: false, error: { message: "Không tìm thấy đơn hàng" } });
    }

    if (order.customerPhone !== phone.trim()) {
      return res.status(403).json({ ok: false, error: { message: "Số điện thoại không khớp với đơn hàng này" } });
    }
    
    return res.json({ ok: true, order });

  } catch (err) {
    next(err);
  }
} 

// 6. CẬP NHẬT TRẠNG THÁI (Admin)
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const validStatuses = ["pending", "confirmed", "shipping", "completed", "canceled"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ ok: false, error: { message: "Trạng thái không hợp lệ" } });
    }

    const order = await Order.findByIdAndUpdate(
      id, 
      { status: status }, 
      { new: true }
    );

    if (!order) return res.status(404).json({ ok: false, error: { message: "Không tìm thấy đơn" } });

    res.json({ ok: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  createOrder, 
  getOrderById, 
  listOrders, 
  getOrdersPublic, 
  trackOrder,    
  updateStatus 
};