const { User } = require("../models/user.model");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "bi_mat_khong_bat_mi", {
    expiresIn: "30d",
  });
};

// 1. Đăng ký
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ ok: false, message: "Email đã tồn tại" });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, 
      role: "user",
    });

    if (user) {
      res.status(201).json({
        ok: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ ok: false, message: "Dữ liệu không hợp lệ" });
    }
  } catch (error) {
    next(error);
  }
}

// 2. Đăng nhập
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        ok: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ ok: false, message: "Sai email hoặc mật khẩu" });
    }
  } catch (error) {
    next(error);
  }
}

// 3. [BỔ SUNG] Hàm lấy thông tin User hiện tại (Me)
async function me(req, res, next) {
  try {
    // req.user được lấy từ middleware requireAuth
    if (!req.user) {
      return res.status(401).json({ ok: false, message: "Chưa đăng nhập" });
    }
    
    // Trả về thông tin user
    res.json({
      ok: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me };