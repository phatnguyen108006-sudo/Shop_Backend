const { z } = require("zod");

// Các trường cơ bản
const productCore = {
  title: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  price: z.coerce.number().min(0, "Giá phải lớn hơn 0"),
  description: z.string().optional(),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  brand: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]), // Mảng link ảnh
  stock: z.coerce.number().min(0).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
  variants: z.array(z.any()).optional(), // JSON variants (Size, Color...)
};

// Schema cho Tạo mới (Create)
const createProductSchema = z.object({
  ...productCore,
  slug: z.string().optional(),
});

// Schema cho Cập nhật (Update)
const updateProductSchema = z.object({
  title: productCore.title.optional(),
  price: productCore.price.optional(),
  description: productCore.description.optional(),
  category: productCore.category.optional(),
  brand: productCore.brand.optional(),
  images: productCore.images.optional(),
  stock: productCore.stock.optional(),
  rating: productCore.rating.optional(),
  variants: productCore.variants.optional(),
  slug: z.string().optional(),
});

module.exports = { createProductSchema, updateProductSchema };