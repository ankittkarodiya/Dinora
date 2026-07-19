const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

const getAnalytics = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) return res.status(404).json({ success: false, message: "Restaurant not found" });

    const period = parseInt(req.query.period) || 7;
    const customFrom = req.query.from;
    const customTo = req.query.to;

    let startDate, endDate;
    if (customFrom && customTo) {
      startDate = new Date(customFrom);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customTo);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      startDate.setHours(0, 0, 0, 0);
    }

    // exclude cancelled orders from all analytics
    const orders = await Order.find({
      restaurantId,
      status: { $ne: "Cancelled" }, // never include cancelled
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // daily revenue
    const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const revenueByDay = {};
    const ordersCountByDay = {};

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      revenueByDay[key] = 0;
      ordersCountByDay[key] = 0;
    }

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (revenueByDay[key] !== undefined) {
        // only count PAID orders for revenue
        if (order.paymentStatus === "paid") {
          revenueByDay[key] += order.totalAmount;
        }
        ordersCountByDay[key] += 1;
      }
    });

    const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date, revenue, orders: ordersCountByDay[date],
    }));

    // top items — exclude cancelled
    const itemCount = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.menuItemId?.toString() || item.name;
        if (!itemCount[id]) itemCount[id] = { name: item.name, count: 0, revenue: 0 };
        itemCount[id].count += item.qty;
        itemCount[id].revenue += item.price * item.qty;
      });
    });
    const topItems = Object.values(itemCount).sort((a, b) => b.count - a.count).slice(0, 10);

    // total revenue = only paid orders, no cancelled
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((s, o) => s + o.totalAmount, 0);

    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

    // payment split
    const onlinePaid = orders.filter((o) => o.paymentMethod === "online" && o.paymentStatus === "paid").length;
    const cashPaid = orders.filter((o) => o.paymentMethod === "cash" && o.paymentStatus === "paid").length;
    const unpaid = orders.filter((o) => o.paymentStatus !== "paid").length;

    res.json({
      success: true,
      period,
      startDate,
      endDate,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      dailyRevenue,
      topItems,
      paymentSplit: { online: onlinePaid, cash: cashPaid, unpaid },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAnalytics };
