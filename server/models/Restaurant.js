const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    subscriptionPlan: {
      type: String,
      enum: ["trial", "basic", "pro"],
      required: true, // ← no default — must always be explicitly set at creation time
    },
    subscriptionBillingCycle: {
      type: String,
      enum: ["none", "monthly", "yearly"], // "none" for trial
      default: "monthly",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days trial
      // default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      // default: () => new Date(Date.now() + 2 * 60 * 1000),
    },
    subscriptionPaymentId: { type: String, default: "" },

    razorpayKeyId: { type: String, default: "" },
    razorpayKeySecret: { type: String, default: "", select: false },
    razorpayLinked: { type: Boolean, default: false },

    gstNumber: { type: String, default: "" },
    gstPercent: { type: Number, default: 5 },
    cgstPercent: { type: Number, default: 2.5 },
    sgstPercent: { type: Number, default: 2.5 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Restaurant", restaurantSchema);