const mongoose = require("mongoose");

const PLANS = {
  basic: {
    name: "Basic",
    price: 999,
    duration: 30, // days
    features: [
      "QR ordering",
      "Menu management",
      "Up to 10 tables",
      "Basic orders",
    ],
  },
  pro: {
    name: "Pro",
    price: 1999,
    duration: 30,
    features: [
      "Everything in Basic",
      "Analytics",
      "Reviews",
      "Up to 30 tables",
      "Order tracking",
    ],
  },
  // premium: {
  //   name: "Premium",
  //   price: 3999,
  //   duration: 30,
  //   features: ["Everything in Pro", "Unlimited tables", "Custom branding", "Priority support"],
  // },
};

const subscriptionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    plan: { type: String, enum: ["basic", "pro", "premium"], required: true },
    billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
    },
    amount: { type: Number, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "pending",
    },
    startsAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
