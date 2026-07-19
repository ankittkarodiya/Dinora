const mongoose = require("mongoose");

// A session starts when customer scans QR and ends when they pay
const sessionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    // new
    paymentMethod: {
      type: String,
      enum: ["online", "cash", null],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paidAt: { type: Date, default: null },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);