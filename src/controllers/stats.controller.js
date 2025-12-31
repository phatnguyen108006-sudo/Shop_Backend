const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { User } = require("../models/user.model"); 

async function getDashboardStats(req, res, next) {
  try {
    // 1. Tính tổng doanh thu & số liệu cơ bản (Code cũ)
    const revenueStats = await Order.aggregate([
      { $match: { status: { $ne: "canceled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    const [totalOrders, totalProducts, pendingOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: "pending" })
    ]);

    // 2. [MỚI] Tính doanh thu 7 ngày gần nhất để vẽ biểu đồ
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo }, // Chỉ lấy đơn trong 7 ngày qua
          status: { $ne: "canceled" }        // Không tính đơn hủy
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Gom nhóm theo ngày (VD: 2023-10-25)
          total: { $sum: "$total" } // Cộng tổng tiền ngày đó
        }
      },
      { $sort: { _id: 1 } } // Sắp xếp từ ngày cũ -> mới
    ]);

    // Format lại dữ liệu cho Frontend dễ dùng
    // Kết quả sẽ là: [{ name: "25/10", total: 1500000 }, ...]
    const chartData = dailyRevenue.map(item => {
        const [year, month, day] = item._id.split("-");
        return {
            name: `${day}/${month}`,
            total: item.total
        };
    });

    res.json({
      ok: true,
      data: {
        revenue: totalRevenue,
        orders: totalOrders,
        products: totalProducts,
        pendingOrders: pendingOrders,
        chartData: chartData // Trả thêm cái này
      }
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };