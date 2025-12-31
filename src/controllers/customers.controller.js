const { User } = require("../models/user.model");

// Lấy danh sách khách hàng (trừ Admin)
async function getCustomers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const q = req.query.q || "";

    // Điều kiện lọc: Chỉ lấy role 'user' (nếu bạn có phân quyền), và tìm theo tên/email
    const filter = {
      role: { $ne: "admin" }, // Không lấy admin
      $or: [
        { fullName: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ]
    };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password") // Quan trọng: Không trả về mật khẩu
      .sort({ createdAt: -1 }) // Người mới nhất lên đầu
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      ok: true,
      data: users,
      total,
      page,
      limit,
      hasNext: page * limit < total
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCustomers };