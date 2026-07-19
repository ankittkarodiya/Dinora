const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// GET /api/orders
// const getOrders = async (req, res) => {
//   try {
//     const restaurantId = await getRestaurantId(req.user._id);
//     if (!restaurantId) {
//       return res.status(404).json({ success: false, message: "Restaurant not found" });
//     }
//     const orders = await Order.find({ restaurantId })
//       .populate("tableId", "name capacity")
//       .populate("sessionId", "status paymentMethod paymentStatus")
//       .sort({ createdAt: -1 });
//     res.json({ success: true, orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const getOrders = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) return res.status(404).json({ success: false, message: "Restaurant not found" });
    const orders = await Order.find({ restaurantId })
      .populate("tableId", "name capacity")
      .populate("customerId", "username phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/accept
const acceptOrder = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Only pending orders can be accepted" });
    }
    order.status = "Accepted";
    order.acceptedAt = new Date();
    await order.save();
    await order.populate("tableId", "name capacity");
    await order.populate("sessionId", "status paymentMethod paymentStatus");
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/print
// Mark slip as printed and move to Preparing
const markSlipPrinted = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "Accepted") {
      return res.status(400).json({ success: false, message: "Order must be accepted before printing" });
    }
    order.slipPrintedAt = new Date();
    order.status = "Preparing";
    await order.save();
    await order.populate("tableId", "name capacity");
    await order.populate("sessionId", "status paymentMethod paymentStatus");
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/status
// const updateOrderStatus = async (req, res) => {
//   try {
//     const restaurantId = await getRestaurantId(req.user._id);
//     const { status } = req.body;
//     const validStatuses = ["Ready", "Served", "Completed"];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ success: false, message: "Invalid status" });
//     }
//     const order = await Order.findOneAndUpdate(
//       { _id: req.params.id, restaurantId },
//       { status },
//       { new: true }
//     )
//       .populate("tableId", "name capacity")
//       .populate("sessionId", "status paymentMethod paymentStatus");
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }
//     res.json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const updateOrderStatus = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const { status } = req.body;

    const validStatuses = ["Ready", "Served", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;

    // ← THE FIX: if this order is being marked Served AND it was already
    // paid online, auto-advance straight to Completed. Cash orders stay
    // at Served until the admin manually confirms cash was received.
    if (status === "Served" && order.paymentMethod === "online" && order.paymentStatus === "paid") {
      order.status = "Completed";
    }

    await order.save();
    await order.populate("tableId", "name capacity");
    await order.populate("sessionId", "status paymentMethod paymentStatus");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (["Completed", "Cancelled", "Preparing", "Ready", "Served"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is ${order.status.toLowerCase()}`,
      });
    }
    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by restaurant";
    await order.save();
    await order.populate("tableId", "name capacity");
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOrders, acceptOrder, markSlipPrinted, updateOrderStatus, cancelOrder };