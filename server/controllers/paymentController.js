const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Session = require("../models/Session");
const Restaurant = require("../models/Restaurant");
const { encrypt, decrypt } = require("../utils/encryption");

// ── POST /api/public/payment/preflight ────────────────────────────
// Called BEFORE any order exists. Confirms this restaurant can accept
// online payment right now. Never touches Order or Session.

// new preflight check
// ── POST /api/public/payment/preflight ────────────────────────────
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
    // } catch {
    //   return res.status(400).json({ success: false, code: "RAZORPAY_KEY_INVALID", message: "This restaurant's payment setup is invalid. Please pay by cash." });
    // }
    } catch (decErr) {
  console.error("createPaymentOrder decrypt failed:", decErr.message);
  return res.status(400).json({ success: false, code: "RAZORPAY_KEY_INVALID", message: "This restaurant's payment setup is invalid. Please pay by cash." });
}

    // authoritative amount — sum of this session's actual unpaid orders
    const unpaidOrders = await Order.find({ sessionId, status: { $ne: "Cancelled" }, paymentStatus: { $ne: "paid" } });
    if (unpaidOrders.length === 0) {
      return res.status(400).json({ success: false, code: "NOTHING_TO_PAY", message: "Nothing to pay for in this session." });
    }
    const amount = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

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
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message || "Failed to create payment." });
  }
};

// ── POST /api/public/payment/verify ───────────────────────────────
// const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, restaurantId } = req.body;

//     let keySecret = process.env.RAZORPAY_KEY_SECRET;
//     if (restaurantId) {
//       const restaurant = await Restaurant.findById(restaurantId).select("+razorpayKeySecret");
//       if (restaurant?.razorpayLinked && restaurant.razorpayKeySecret) {
//         keySecret = decrypt(restaurant.razorpayKeySecret);
//       }
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false, code: "SIGNATURE_MISMATCH", message: "Payment verification failed." });
//     }

//     await Order.updateMany(
//       { sessionId, status: { $ne: "Cancelled" }, paymentStatus: { $ne: "paid" } },
//       { status: "Completed", paymentMethod: "online", paymentStatus: "paid" }
//     );
//     await Session.findByIdAndUpdate(sessionId, { status: "completed", paymentMethod: "online", paymentStatus: "paid", paidAt: new Date() });

//     res.json({ success: true, message: "Payment verified and order completed" });
//   } catch (error) {
//     res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message });
//   }
// };

// new verify payment
// const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, restaurantId } = req.body;

//     // guard against a missing sessionId before it ever reaches the updateMany filter
//     if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, code: "MISSING_FIELDS", message: "Missing required payment fields." });
//     }

//     let keySecret = process.env.RAZORPAY_KEY_SECRET;
//     if (restaurantId) {
//       const restaurant = await Restaurant.findById(restaurantId).select("+razorpayKeySecret");
//       if (restaurant?.razorpayLinked && restaurant.razorpayKeySecret) {
//         keySecret = decrypt(restaurant.razorpayKeySecret);
//       }
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false, code: "SIGNATURE_MISMATCH", message: "Payment verification failed." });
//     }

//     await Order.updateMany(
//       { sessionId, status: { $ne: "Cancelled" }, paymentStatus: { $ne: "paid" } },
//       { status: "Completed", paymentMethod: "online", paymentStatus: "paid" }
//     );
//     await Session.findByIdAndUpdate(sessionId, { status: "completed", paymentMethod: "online", paymentStatus: "paid", paidAt: new Date() });

//     res.json({ success: true, message: "Payment verified and order completed" });
//   } catch (error) {
//     console.error("Verify payment error:", error); // ← also add this — this function currently has NO error logging at all
//     res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message });
//   }
// };

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, restaurantId } = req.body;

    if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    // ← THE FIX — payment method + paid flag are recorded, but the order's
    // kitchen status is left completely untouched. It still has to go
    // through Accepted → Preparing → Ready → Served like any other order.
    // "Completed" is now ONLY set automatically when the order reaches
    // "Served" (handled in updateOrderStatus below), not here.
    await Order.updateMany(
      { sessionId, status: { $ne: "Cancelled" }, paymentStatus: { $ne: "paid" } },
      { paymentMethod: "online", paymentStatus: "paid" } // ← status field removed entirely from this update
    );

    await Session.findByIdAndUpdate(sessionId, { paymentMethod: "online", paymentStatus: "paid", paidAt: new Date() });
    // ← Session.status is no longer force-set to "completed" here either —
    // it should reflect the table's actual dining state, not payment state

    res.json({ success: true, message: "Payment verified. Your order is being processed." });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message });
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
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message });
  }
};

// ── PATCH /api/orders/:id/confirm-cash ─────────────────────────────
const confirmCashPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, code: "ORDER_NOT_FOUND", message: "Order not found" });

    order.status = "Completed";
    order.paymentStatus = "paid";
    await order.save();

    const remaining = await Order.find({ sessionId: order.sessionId, status: { $nin: ["Cancelled", "Completed"] } });
    if (remaining.length === 0) {
      await Session.findByIdAndUpdate(order.sessionId, { status: "completed", paymentStatus: "paid", paidAt: new Date() });
    }

    await order.populate("tableId", "name");
    await order.populate("customerId", "username phone"); // ← new

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: error.message });
  }
};


module.exports = { preflightCheck, createPaymentOrder, verifyPayment, requestCashPayment, confirmCashPayment };
