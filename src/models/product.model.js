const { Schema, model } = require("mongoose");

const VariantSchema = new Schema(
  {
    color: { type: String, required: true },
    size: { type: String },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    
    // MỤC 9: Bổ sung giá khuyến mãi (Giảm giá)
    discountPrice: { type: Number, min: 0, default: 0 }, 
    
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0 },
    
    // MỤC 7: Đánh giá (Giữ nguyên nhưng thêm default 5 nếu muốn web trông đẹp ngay từ đầu)
    rating: { type: Number, min: 0, max: 5, default: 5 }, 
    
    brand: { type: String },
    variants: { type: [VariantSchema], default: [] },
    description: { type: String },
    
    // MỤC 17: Phân loại sản phẩm (Có thể dùng enum để cố định danh mục nếu muốn)
    category: { 
      type: String, 
      required: true, 
      index: true 
    },
    
    // Bổ sung thêm trường này để Admin quản lý trạng thái hiển thị
    isActive: { type: Boolean, default: true } 
  },
  { timestamps: true, versionKey: false }
);

// Index text để tìm kiếm nhanh (MỤC 4)
ProductSchema.index({ title: "text", brand: "text", category: "text" });

ProductSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    // Xóa _id gốc để tránh trùng lặp với virtual id
    delete ret._id; 
    delete ret.__v;
    return ret;
  },
});

const Product = model("Product", ProductSchema);
module.exports = { Product };