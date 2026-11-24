const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

// new for counter orders
const Table = require("../models/Table");
const Session = require("../models/Session");
const MenuItem = require("../models/MenuItem");
const Customer = require("../models/Customer");




const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) return res.status(404).json({ success: false, message: "Restaurant not found" });

    const orders = await Order.find({
  restaurantId,
  visibleToKitchen: { $ne: false },
  $nor: [
    { status: "Cancelled", cancellationReason: "Payment not completed" },
    { status: "Cancelled", cancellationReason: "Replaced by new order" },
  ],
})
  .populate("tableId", "name capacity")
  .populate("customerId", "username phone")
  .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
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
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
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
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// PATCH /api/orders/:id/accept-print
// The simplified flow. "Accept" in the UI only opens the bill
// preview (no API call). THIS runs when the staff taps "Print Bill":
// Pending (or a legacy Accepted order) -> Preparing in a single step.
// Closing the preview never calls this, so the order simply stays Pending.
const acceptAndPrint = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (!["Pending", "Accepted"].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Order is already ${order.status.toLowerCase()}` });
    }
    order.status = "Preparing";
    order.acceptedAt = order.acceptedAt || new Date();
    order.slipPrintedAt = new Date();
    await order.save();
    await order.populate("tableId", "name capacity");
    await order.populate("sessionId", "status paymentMethod paymentStatus");
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const { status } = req.body;

    // "Ready" stage removed: staff go Preparing -> Served directly.
    const validStatuses = ["Served", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({ _id: req.params.id, restaurantId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // only legal jumps. Legacy "Accepted"/"Ready" orders (created
    // before the flow was simplified) can still be marked Served so nothing
    // gets stuck.
    const allowedFrom = {
      Served: ["Preparing", "Accepted", "Ready"],
      Completed: ["Served"],
    };
    if (!allowedFrom[status].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot mark a ${order.status.toLowerCase()} order as ${status.toLowerCase()}` });
    }

    order.status = status;

    // if this order is being marked Served AND it was already
    // paid online, auto-advance straight to Completed. Cash orders stay
    // at Served until the admin manually confirms cash was received.
    if (status === "Served" && order.paymentMethod === "online" && order.paymentStatus === "paid") {
      order.status = "Completed";
    }

    await order.save();
    await order.populate("tableId", "name capacity");
    await order.populate("sessionId", "status paymentMethod paymentStatus");
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
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
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};


// new for counter orders
// POST /api/orders/counter
// Admin places a walk-in order at the counter. It is created already
// Completed + paid, so it counts in revenue and needs no accept/serve steps.
// body: { items: [{ menuItemId, qty, portion }], customerName?, customerPhone?,
//         paymentMethod: "cash" | "online" }
const createCounterOrder = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    const restaurantId = restaurant._id;

    const { items, customerName, customerPhone, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }
    for (const i of items) {
      if (!i.menuItemId || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 50) {
        return res.status(400).json({ success: false, message: "Invalid item in order" });
      }
    }

    const payMethod = paymentMethod === "online" ? "online" : "cash";

    // real prices from the DB — never trust the client
    const dbItems = await MenuItem.find({
      _id: { $in: items.map((i) => i.menuItemId) },
      restaurantId,
    });
    const dbItemMap = new Map(dbItems.map((m) => [m._id.toString(), m]));

    const orderItems = [];
    for (const i of items) {
      const dbItem = dbItemMap.get(String(i.menuItemId));
      if (!dbItem) {
        return res.status(400).json({ success: false, message: "An item in the order no longer exists" });
      }
      if (dbItem.isAvailable === false) {
        return res.status(400).json({ success: false, message: `${dbItem.name} is currently unavailable` });
      }
      const portion = i.portion === "half" || i.portion === "full" ? i.portion : null;
      const price =
        portion === "half" && dbItem.halfPrice != null ? dbItem.halfPrice : dbItem.price;

      orderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price,
        qty: i.qty,
        isVeg: dbItem.isVeg,
        portion,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstPercent = restaurant.gstPercent ?? 5;
    const gstAmount = Math.round(((subtotal * gstPercent) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // the restaurant's hidden "Counter" table (created on first use)
    const table = await Table.findOneAndUpdate(
      { restaurantId, isCounter: true },
      // { $setOnInsert: { restaurantId, name: "Counter", capacity: 1, isCounter: true } },
      { $setOnInsert: { name: "Counter", } },

      { upsert: true, new: true },
    );

    // optional customer (same matching rules as the QR flow)
    // let customerId = null;
    // if (customerName?.trim() && customerPhone?.trim()) {
    //   const cleanPhone = customerPhone.trim().replace(/\D/g, "").slice(-10);
    //   let customer = await Customer.findOne({
    //     $or: [
    //       { phone: cleanPhone, restaurantId },
    //       { phone: `+91${cleanPhone}`, restaurantId },
    //       { phone: `91${cleanPhone}`, restaurantId },
    //     ],
    //   });
    //   if (!customer) {
    //     customer = await Customer.create({
    //       username: customerName.trim(),
    //       phone: cleanPhone,
    //       restaurantId,
    //     });
    //   }
    //   customerId = customer._id;
    // }

    // new
    // optional customer details: name, phone, both, or neither
    const cleanName = (customerName || "").trim();
    const cleanPhone = (customerPhone || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "Phone number must be 10 digits" });
    }

    // Link to an EXISTING customer only. A counter order never creates one.
    let customerId = null;
    if (cleanPhone) {
      const existing = await Customer.findOne({
        $or: [
          { phone: cleanPhone, restaurantId },
          { phone: `+91${cleanPhone}`, restaurantId },
          { phone: `91${cleanPhone}`, restaurantId },
        ],
      });
      if (existing) customerId = existing._id;
    }



    const now = new Date();

    const session = await Session.create({
      restaurantId,
      tableId: table._id,
      status: "completed",
      totalAmount,
      paymentMethod: payMethod,
      paymentStatus: "paid",
      paidAt: now,
    });

    const order = await Order.create({
      restaurantId,
      sessionId: session._id,
      tableId: table._id,
      customerId,

      // new
      // guestName,
      guestName: cleanName,
      guestPhone: cleanPhone,

      items: orderItems,
      subtotal,
      gstPercent,
      gstAmount,
      totalAmount,
      status: "Completed",
      acceptedAt: now,
      slipPrintedAt: now,
      paymentMethod: payMethod,
      paymentStatus: "paid",
      tokenNumber: null,
      tokenActive: false,
      visibleToKitchen: true,
    });

    await order.populate("tableId", "name capacity");
    await order.populate("customerId", "username phone");

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("COUNTER ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    });
  }
};


module.exports = { getOrders, acceptOrder, markSlipPrinted, acceptAndPrint, updateOrderStatus, cancelOrder, createCounterOrder };
