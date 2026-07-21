const mongoose = require("mongoose");

const PLANS = {
  basic: {
    name: "Basic",
    monthlyPrice: 699,
    yearlyPrice: 6999,
    duration: 30,
    features: [
      "QR code generation for every table",
      "Digital menu with categories and photos",
      "Veg/Non-veg tagging and bestseller marking",
      "Real-time order tracking for kitchen and customers",
      "Kitchen order dashboard",
      "Printable kitchen slips with GST breakdown",
      "Table management",
      "Order history with date-range filtering",
      "Cash and online payments (your own Razorpay)",
      "Up to 10 tables",
    ],
  },
  pro: {
    name: "Pro",
    monthlyPrice: 1299,
    yearlyPrice: 12999,
    duration: 30,
    features: [
      "Everything in Basic",
      "Customer reviews and dish ratings",
      "Top-rated dishes ranking",
      "Revenue and order trend charts for 7/14/30 days or custom range",
      "Payment method breakdown (cash vs online)",
      "Overall rating summary with star distribution",
      "Up to 30 tables",
    ],
  },
};

const subscriptionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    plan: { type: String, enum: ["basic", "pro"], required: true }, // ← removed "premium"
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
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);

























// const mongoose = require("mongoose");

// const PLANS = {
//   basic: {
//     name: "Basic",
//     price: 999,
//     duration: 30, // days
//     features: [
//       "QR ordering",
//       "Menu management",
//       "Up to 10 tables",
//       "Basic orders",
//     ],
//   },
//   pro: {
//     name: "Pro",
//     price: 1999,
//     duration: 30,
//     features: [
//       "Everything in Basic",
//       "Analytics",
//       "Reviews",
//       "Up to 30 tables",
//       "Order tracking",
//     ],
//   },
//   // premium: {
//   //   name: "Premium",
//   //   price: 3999,
//   //   duration: 30,
//   //   features: ["Everything in Pro", "Unlimited tables", "Custom branding", "Priority support"],
//   // },
// };

// const subscriptionSchema = new mongoose.Schema(
//   {
//     restaurantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//     },
//     plan: { type: String, enum: ["basic", "pro", "premium"], required: true },
//     billingCycle: {
//     type: String,
//     enum: ["monthly", "yearly"],
//     default: "monthly",
//     },
//     amount: { type: Number, required: true },
//     razorpayOrderId: { type: String },
//     razorpayPaymentId: { type: String },
//     status: {
//       type: String,
//       enum: ["pending", "active", "failed"],
//       default: "pending",
//     },
//     startsAt: { type: Date },
//     expiresAt: { type: Date },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("Subscription", subscriptionSchema);