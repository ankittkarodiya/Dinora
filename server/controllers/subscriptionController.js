const crypto = require("crypto");
const Razorpay = require("razorpay");
const Restaurant = require("../models/Restaurant");
const Subscription = require("../models/Subscription");

const { encrypt } = require("../utils/encryption");


// const PLANS = {
//   basic:   { price: 999,  days: 30, name: "Basic" },
//   pro:     { price: 1999, days: 30, name: "Pro" },
// //   premium: { price: 3999, days: 30, name: "Premium" },
// };

const PLANS = {
  basic: {
    monthly: { price: 699, days: 30, name: "Basic (Monthly)" },
    yearly:  { price: 6999, days: 365, name: "Basic (Yearly)" },
  },
  pro: {
    monthly: { price: 1299, days: 30, name: "Pro (Monthly)" },
    yearly:  { price: 12999, days: 365, name: "Pro (Yearly)" },
  },
};


// POST /api/subscription/create-order
const createSubscriptionOrder = async (req, res) => {
  try {
    // const { plan } = req.body;
    // if (!PLANS[plan]) {
    //   return res.status(400).json({ success: false, message: "Invalid plan" });
    // }

    const { plan, billingCycle } = req.body;
    const cycle = billingCycle === "yearly" ? "yearly" : "monthly";

    if (!PLANS[plan] || !PLANS[plan][cycle]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // const planInfo = PLANS[plan][cycle];


    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay not configured" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // const planInfo = PLANS[plan];
    const planInfo = PLANS[plan][cycle];

    // FIX: receipt must be under 40 chars
    // use short timestamp (last 8 digits) + short user id slice
    const shortReceipt = `sub_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;
    // e.g. "sub_51246eb54_45678901" — well under 40 chars

    const options = {
      amount: planInfo.price * 100,
      currency: "INR",
      receipt: shortReceipt,
      notes: { plan, userId: req.user._id.toString() },
    };

    const order = await razorpay.orders.create(options);

    // const restaurant = await Restaurant.findOne({ userId: req.user._id });
    // if (restaurant) {
    //   await Subscription.create({
    //     restaurantId: restaurant._id,
    //     plan,
    //     amount: planInfo.price,
    //     razorpayOrderId: order.id,
    //     status: "pending",
    //   });
    // }

    // res.json({ success: true, order, plan: planInfo, keyId: process.env.RAZORPAY_KEY_ID });

    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (restaurant) {
      await Subscription.create({
        restaurantId: restaurant._id,
        // plan: `${plan}_${cycle}`, // e.g. "basic_yearly" — keeps cycle info in the record
        plan, // ← just "basic" or "pro", matches the existing enum, no suffix
        billingCycle: cycle, // ← cycle info lives here instead
        amount: planInfo.price,
        razorpayOrderId: order.id,
        status: "pending",
      });
    }

    res.json({ success: true, order, plan: planInfo, keyId: process.env.RAZORPAY_KEY_ID });


  } catch (error) {
    console.error("Subscription order error:", error);
    res.status(500).json({ success: false, message: error.error?.description || error.message || "Failed to create payment order" });
  }
};



// POST /api/subscription/verify
const verifySubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment signature mismatch" });
    }

    // ← FIX: read from the nested structure, matching createSubscriptionOrder
    const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const planInfo = PLANS[plan]?.[cycle];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

    const restaurant = await Restaurant.findOneAndUpdate(
      { userId: req.user._id },
      {
        subscriptionPlan: plan, // ← stays just "basic"/"pro", matching your Restaurant model's enum
        subscriptionBillingCycle: cycle, // ← for yrly and monthly
        subscriptionStatus: "active",
        subscriptionExpiresAt: expiresAt,
        subscriptionPaymentId: razorpay_payment_id,
      },
      { new: true }
    );

    await Subscription.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, status: "active", startsAt: new Date(), expiresAt }
    );

    res.json({ success: true, message: "Subscription activated!", restaurant });
  } catch (error) {
    console.error("Subscription verify error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/subscription/status
const getSubscriptionStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const isExpired = restaurant.subscriptionExpiresAt < new Date();
    if (isExpired && restaurant.subscriptionStatus === "active") {
      await Restaurant.findByIdAndUpdate(restaurant._id, { subscriptionStatus: "expired" });
    }

    res.json({
      success: true,
      subscription: {
        plan: restaurant.subscriptionPlan,
        billingCycle: restaurant.subscriptionBillingCycle, // for yrly and monthly
        status: isExpired ? "expired" : restaurant.subscriptionStatus,
        expiresAt: restaurant.subscriptionExpiresAt,
        razorpayLinked: restaurant.razorpayLinked,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// new
const addRazorpayKeys = async (req, res) => {
  try {
    const { keyId, keySecret } = req.body;
    if (!keyId || !keySecret) {
      return res.status(400).json({ success: false, message: "Both Key ID and Secret are required" });
    }

    try {
      const testRazorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      await testRazorpay.orders.create({ amount: 100, currency: "INR", receipt: "test_key_chk" });
    } catch {
      return res.status(400).json({ success: false, message: "Invalid Razorpay keys. Please check and try again." });
    }

    await Restaurant.findOneAndUpdate(
      { userId: req.user._id },
      { razorpayKeyId: keyId, razorpayKeySecret: encrypt(keySecret), razorpayLinked: true }
    );

    res.json({ success: true, message: "Razorpay linked!", razorpayLinked: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSubscriptionOrder, verifySubscription, getSubscriptionStatus, addRazorpayKeys };