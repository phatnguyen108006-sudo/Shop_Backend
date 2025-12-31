const { z } = require("zod");

const orderItemInputSchema = z.object({
  // 1. productId: Chấp nhận cả String hoặc Number (tự chuyển về String)
  // Lý do: Đôi khi Frontend gửi ID dạng số, backend cần convert để không lỗi
  productId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),

  // 2. customerPhone: Sửa lỗi quan trọng nhất ở đây
  // Logic: Chấp nhận chuỗi rỗng "" HOẶC chuỗi dài > 8 ký tự HOẶC không gửi (undefined)
  customerPhone: z.union([
    z.string().length(0), // Chấp nhận chuỗi rỗng ""
    z.string().min(8, "Số điện thoại không hợp lệ"),     // Hoặc phải đủ 8 số
    z.undefined(),        // Hoặc không gửi
    z.null()
  ]).optional().transform(e => e === "" ? undefined : e), // Nếu rỗng thì coi như không có

  customerAddress: z.string().min(5, "Địa chỉ quá ngắn"),

  // 3. paymentMethod: Thêm catch cho trường hợp gửi sai
  paymentMethod: z.enum(["cod", "banking", "momo"]).default("cod").catch("cod"),

  note: z.string().max(500).optional(),
  
  items: z.array(orderItemInputSchema).min(1, "Giỏ hàng không được trống"),
  
  // 4. totalPrice: Frontend có gửi nhưng Backend tự tính lại, 
  // thêm vào đây để Zod không báo lỗi "Unrecognized key" (dù mặc định là strip)
  totalPrice: z.number().optional(), 
});

module.exports = { createOrderSchema };