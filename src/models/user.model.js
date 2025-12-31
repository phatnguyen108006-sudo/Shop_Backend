const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs"); // Cần cài: npm install bcryptjs

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    
    // Lưu mật khẩu đã mã hóa tại đây
    passwordHash: { type: String, required: true },
    
    // Role: user hoặc admin
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  },
  { timestamps: true, versionKey: false }
);

// --- 1. MIDDLEWARE: Tự động mã hóa trước khi lưu ---
UserSchema.pre("save", async function (next) {
  // Nếu passwordHash chưa bị thay đổi (ví dụ chỉ sửa tên), thì bỏ qua bước này
  if (!this.isModified("passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    // Mã hóa chuỗi trong passwordHash và lưu đè lại
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// --- 2. METHOD: So sánh mật khẩu khi đăng nhập ---
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // So sánh mật khẩu nhập vào (123456) với mật khẩu mã hóa trong DB ($2a$10$...)
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// --- 3. TOJSON: Xóa thông tin nhạy cảm khi trả về client ---
UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash; // Không bao giờ trả về mật khẩu (dù đã mã hóa)
    return ret;
  },
});

const User = model("User", UserSchema);
module.exports = { User };