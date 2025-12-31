const slugify = require("slugify");
const { isValidObjectId } = require("mongoose"); // Import thêm cái này để check ID
const { Product } = require("../models/product.model");

// --- HELPER FUNCTIONS ---
function makeSlug(input) {
  if (!input) return "";
  return slugify(input, { lower: true, strict: true, locale: "vi" });
}

function pickUpdatable(body) {
  const allow = [
    "title", "slug", "price", "discountPrice", "images", 
    "stock", "rating", "brand", "variants", "description", "category"
  ];
  const out = {};
  for (const k of allow) if (k in body) out[k] = body[k];
  return out;
}

// --- MAIN FUNCTIONS ---

// 1. Tạo sản phẩm
async function createProduct(req, res, next) {
  try {
    const payload = req.body;
    
    // Tự động tạo slug nếu thiếu
    const slug = payload.slug ? payload.slug : makeSlug(payload.title);
    
    // Validate giá
    if (payload.discountPrice && payload.discountPrice > payload.price) {
        return res.status(400).json({ ok: false, message: "Giá giảm không được lớn hơn giá gốc" });
    }

    const doc = await Product.create({ ...payload, slug });
    return res.status(201).json({ ok: true, product: doc.toJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      err.status = 409; 
      err.message = "Tên sản phẩm (slug) đã tồn tại, vui lòng đổi tên khác";
    }
    return next(err);
  }
}

// 2. Cập nhật sản phẩm
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check ID hợp lệ trước khi gọi DB
    if (!isValidObjectId(id)) {
        return res.status(400).json({ ok: false, message: "ID sản phẩm không hợp lệ" });
    }

    const patch = pickUpdatable(req.body);

    // Nếu sửa tiêu đề mà không sửa slug -> Tự tạo slug mới
    if (patch.title && !patch.slug) patch.slug = makeSlug(patch.title);

    const updated = await Product.findByIdAndUpdate(
        id, 
        patch, 
        { new: true, runValidators: true }
    );

    if (!updated) {
        return res.status(404).json({ ok: false, message: "Không tìm thấy sản phẩm" });
    }

    return res.json({ ok: true, product: updated.toJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      err.status = 409;
      err.message = "Tên sản phẩm (slug) bị trùng lặp";
    }
    return next(err);
  }
}

// 3. Xóa sản phẩm
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
        return res.status(400).json({ ok: false, message: "ID không hợp lệ" });
    }

    const del = await Product.findByIdAndDelete(id);
    
    if (!del) {
        return res.status(404).json({ ok: false, message: "Không tìm thấy sản phẩm để xóa" });
    }
    
    return res.json({ ok: true, deletedId: id, message: "Xóa thành công" });
  } catch (err) {
    return next(err);
  }
}

// 4. Lấy danh sách sản phẩm (Có Phân trang + Tìm kiếm Regex)
async function getProducts(req, res, next) {
    try {
        // Lấy tham số từ URL
        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 100); // Mặc định lấy nhiều chút cho trang Admin
        const { category, search, q } = req.query; // 'q' là biến search từ frontend Admin gửi lên

        let query = {};
        
        // Lọc theo danh mục
        if (category) query.category = category;
        
        // Tìm kiếm (Hỗ trợ cả biến 'search' và 'q')
        const keyword = search || q;
        if (keyword) {
            // Dùng Regex tìm kiếm gần đúng (không cần index text)
            query.title = { $regex: keyword, $options: "i" };
        }

        const [docs, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 }) // Mới nhất lên đầu
                .skip((page - 1) * limit)
                .limit(limit),
            Product.countDocuments(query)
        ]);
        
        // Trả về cấu trúc chuẩn cho Admin Table
        return res.json({ 
            ok: true, 
            data: docs, // Frontend Admin đang dùng biến 'data' hoặc 'products' đều được
            products: docs, // Giữ cả key này cho Frontend cũ đỡ lỗi
            total,
            page,
            limit
        });
    } catch (err) {
        return next(err);
    }
}

// 5. Lấy chi tiết 1 sản phẩm (Cho trang Edit)
async function getProductById(req, res, next) {
    try {
        const { id } = req.params;
        
        // 1. Check ID trước
        if (!isValidObjectId(id)) {
             // Fallback: Nếu không phải ID thì thử tìm theo slug (cho trang Shop chi tiết)
             const bySlug = await Product.findOne({ slug: id });
             if (bySlug) return res.json({ ok: true, data: bySlug });
             
             return res.status(400).json({ ok: false, message: "ID không hợp lệ" });
        }

        // 2. Tìm theo ID
        const doc = await Product.findById(id);
        
        if (!doc) {
            return res.status(404).json({ ok: false, message: "Sản phẩm không tồn tại" });
        }

        return res.json({ ok: true, data: doc });
    } catch (err) {
        return next(err);
    }
}

module.exports = { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProducts, // Router đang map vào listProducts hay getProducts thì bạn nhớ check nhé
    getProductById 
};