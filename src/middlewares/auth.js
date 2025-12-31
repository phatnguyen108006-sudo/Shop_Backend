const { verifyToken } = require("../lib/auth");
const { User } = require("../models/user.model");

// 1. Middleware xác thực 
async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập (Missing Token)" } 
      });
    }
    
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).lean(); 

    if (!user) {
      return res.status(401).json({ 
        ok: false, 
        error: { code: "UNAUTHORIZED", message: "User không tồn tại" } 
      });
    }

    req.user = { 
      id: String(user._id), 
      role: user.role, 
      name: user.name, 
      email: user.email 
    };

    next();
  } catch (err) {
    return res.status(401).json({ 
      ok: false, 
      error: { code: "UNAUTHORIZED", message: "Token không hợp lệ hoặc đã hết hạn" } 
    });
  }
}

// 2. Middleware kiểm tra quyền 
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        ok: false, 
        error: { code: "FORBIDDEN", message: "Bạn không có quyền thực hiện hành động này" } 
      });
    }
    next();
  };
}

// 3. Middleware tùy chọn xác thực (nếu có token thì xác thực, không có thì bỏ qua)
async function optionalAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.split(" ")[1] : null;

    // Nếu KHÔNG có token -> Cho qua luôn (req.user sẽ là undefined/null) -> Coi là khách vãng lai
    if (!token) {
      return next();
    }

    // Nếu CÓ token -> Thử xác thực
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).lean();

    // Nếu token hợp lệ và tìm thấy user -> Gắn vào req
    if (user) {
      req.user = { 
        id: String(user._id), 
        role: user.role, 
        name: user.name, 
        email: user.email 
      };
    }
    
    // Xong xuôi thì next()
    next();
  } catch (err) {
    // Nếu token lỗi hoặc hết hạn -> Vẫn cho qua (coi như khách vãng lai), không báo lỗi
    next();
  }
}

module.exports = { requireAuth, requireRole, optionalAuth };