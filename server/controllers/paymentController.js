const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Session = require("../models/Session");
const Restaurant = require("../models/Restaurant");
const { encrypt, decrypt } = require("../utils/encryption");

const { getIO } = require("../config/socket");
const Table = require("../models/Table");
const { notifyNewOrder } = require("../utils/notifyKitchen");

// ── POST /api/public/payment/preflight ────────────────────────────
// Called BEFORE any order exists. Confirms this restaurant can accept
// online payment right now. Never touches Order or Session.
const preflightCheck = async (req, res) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ success: false, code: "MISSING_RESTAURANT", message: "Restaurant not specified." });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("+razorpayKeySecret");
    if (!restaurant) {
      return res.status(404).json({ success: false, code: "RESTAURANT_NOT_FOUND", message: "Restaurant not found." });
    }

    if (restaurant.subscriptionPlan === "trial" || !restaurant.subscriptionPlan) {
      return res.status(400).json({
        success: false, code: "FEATURE_LOCKED",
        message: "This restaurant hasn't activated online payments yet. Please pay by cash.",
      });
    }

    if (!restaurant.razorpayLinked || !restaurant.razorpayKeyId || !restaurant.razorpayKeySecret) {
      return res.status(400).json({
        success: false, code: "RAZORPAY_NOT_LINKED",
        message: "This restaurant hasn't set up online payments yet. Please pay by cash.",
      });
    }

    let decryptedSecret;
    try {
      decryptedSecret = decrypt(restaurant.razorpayKeySecret);
      if (!decryptedSecret) throw new Error("empty secret after decrypt");
    } catch (decErr) {
      console.error("Preflight decrypt failed:", decErr.message);
      return res.status(400).json({
        success: false, code: "RAZORPAY_KEY_INVALID",
        message: "This restaurant's payment setup needs attention. Please pay by cash.",
      });
    }

    try {
      const testRzp = new Razorpay({ key_id: restaurant.razorpayKeyId, key_secret: decryptedSecret });
      await testRzp.orders.create({ amount: 100, currency: "INR", receipt: `pf_${Date.now()}` });
    } catch (rzErr) {
      console.error("Preflight Razorpay auth failed:", rzErr?.error?.description || rzErr.message);
      return res.status(400).json({
        success: false, code: "RAZORPAY_KEY_INVALID",
        message: "This restaurant's payment setup is currently invalid. Please pay by cash.",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Preflight error:", error);
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again." });
  }
};

// ── POST /api/public/payment/create-order ─────────────────────────
const createPaymentOrder = async (req, res) => {
  try {
    const { sessionId, restaurantId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId).select("+razorpayKeySecret");
    if (!restaurant) {
      return res.status(404).json({ success: false, code: "RESTAURANT_NOT_FOUND", message: "Restaurant not found." });
    }

    if (restaurant.subscriptionPlan === "trial" || !restaurant.subscriptionPlan) {
      return res.status(400).json({ success: false, code: "FEATURE_LOCKED", message: "This restaurant hasn't activated online payments yet. Please pay by cash." });
    }
    if (!restaurant.razorpayLinked || !restaurant.razorpayKeyId || !restaurant.razorpayKeySecret) {
      return res.status(400).json({ success: false, code: "RAZORPAY_NOT_LINKED", message: "This restaurant hasn't set up online payments yet. Please pay by cash." });
    }

    let decryptedSecret;
    try {
      decryptedSecret = decrypt(restaurant.razorpayKeySecret);
      if (!decryptedSecret) throw new Error("empty");
    } catch (decErr) {
      console.error("createPaymentOrder decrypt failed:", decErr.message);
      return res.status(400).json({ success: false, code: "RAZORPAY_KEY_INVALID", message: "This restaurant's payment setup is invalid. Please pay by cash." });
    }

    // charge only for the specific order being paid — not all unpaid orders
    const { orderId } = req.body;
    const orderToPay = await Order.findOne({
      _id: orderId,
      sessionId,
      status: { $ne: "Cancelled" },
      paymentStatus: { $ne: "paid" },
    });
    if (!orderToPay) {
      return res.status(400).json({ success: false, code: "NOTHING_TO_PAY", message: "Nothing to pay for." });
    }
    const amount = orderToPay.totalAmount;

    const razorpay = new Razorpay({ key_id: restaurant.razorpayKeyId, key_secret: decryptedSecret });

    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `ord_${sessionId.toString().slice(-10)}_${Date.now().toString().slice(-8)}`,
      });
    } catch (rzErr) {
      console.error("Razorpay order creation failed:", rzErr?.error?.description || rzErr.message);
      return res.status(400).json({ success: false, code: "RAZORPAY_KEY_INVALID", message: "Payment setup is currently invalid. Please pay by cash." });
    }

    res.json({ success: true, order, keyId: restaurant.razorpayKeyId });
  } catch (error) {
    console.error("Payment order error:", error);
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: process.env.NODE_ENV === "production" ? "Something went wrong" : (error.message || "Failed to create payment.") });
  }
};

// ── POST /api/public/payment/verify ───────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, restaurantId, orderId } = req.body;

    if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, code: "MISSING_FIELDS", message: "Missing required payment fields." });
    }

    let keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId).select("+razorpayKeySecret");
      if (restaurant?.razorpayLinked && restaurant.razorpayKeySecret) {
        keySecret = decrypt(restaurant.razorpayKeySecret);
      }
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, code: "SIGNATURE_MISMATCH", message: "Payment verification failed." });
    }

    // check if this was a hidden kiosk order BEFORE flipping visibility
    const paidOrder = await Order.findById(orderId);
    const wasHidden = paidOrder && !paidOrder.visibleToKitchen;

    // only update THIS specific order — not all orders in session
    await Order.updateOne(
      { _id: orderId },
      { paymentMethod: "online", paymentStatus: "paid", visibleToKitchen: true }
    );

    await Session.findByIdAndUpdate(sessionId, { paymentMethod: "online", paymentStatus: "paid", paidAt: new Date() });

    res.json({ success: true, message: "Payment verified. Your order is being processed." });

    // notify admin if this was a hidden kiosk order that just became visible
    if (wasHidden) {
      try {
        const notifyOrder = await Order.findById(orderId)
          .populate("tableId", "name capacity")
          .populate("customerId", "username phone");
        if (notifyOrder) {

          // getIO().to(`restaurant-${notifyOrder.restaurantId}`).emit("newOrder", notifyOrder);
          // new
          await notifyNewOrder(notifyOrder);

        }
      } catch (notifyErr) {
        console.error("Kiosk order notify failed:", notifyErr.message);
      }
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── POST /api/public/payment/cash-request ─────────────────────────
const requestCashPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await Session.findByIdAndUpdate(sessionId, { paymentMethod: "cash", paymentStatus: "pending" });
    await Order.updateMany(
      { sessionId, status: { $nin: ["Cancelled", "Completed"] } },
      { paymentMethod: "cash" }
    );
    res.json({ success: true, message: "Cash payment requested" });
  } catch (error) {
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── PATCH /api/orders/:id/confirm-cash ─────────────────────────────
const confirmCashPayment = async (req, res) => {
  try {
    // ← SECURITY: verify the order belongs to this admin's restaurant
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, code: "RESTAURANT_NOT_FOUND", message: "Restaurant not found" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, code: "ORDER_NOT_FOUND", message: "Order not found" });

    if (order.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ success: false, code: "FORBIDDEN", message: "This order does not belong to your restaurant" });
    }

    order.status = "Completed";
    order.paymentStatus = "paid";
    await order.save();

    const remaining = await Order.find({ sessionId: order.sessionId, status: { $nin: ["Cancelled", "Completed"] } });
    if (remaining.length === 0) {
      await Session.findByIdAndUpdate(order.sessionId, { status: "completed", paymentStatus: "paid", paidAt: new Date() });
    }

    await order.populate("tableId", "name");
    await order.populate("customerId", "username phone");

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

module.exports = { preflightCheck, createPaymentOrder, verifyPayment, requestCashPayment, confirmCashPayment };
