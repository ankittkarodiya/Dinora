// after kiosk
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: String,
  price: Number, // snapshot at order time — immune to later menu price changes
  qty: { type: Number, required: true, min: 1 },
  isVeg: Boolean,
  // ← new: which portion was ordered. null for items that have no half/full option
  portion: { type: String, enum: ["half", "full", null], default: null },
});

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    items: [orderItemSchema],

    // full money breakdown, snapshotted at order time — a later change to
    // the restaurant's GST% never rewrites the history of past orders
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true }, // subtotal + gstAmount — actual amount charged

    // "Accepted" and "Ready" are no longer created by the app (flow is now
    // Pending → Preparing → Served → Completed) but stay in the enum so old
    // orders in those states remain valid and can still be actioned.
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Preparing", "Ready", "Served", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: { type: String, enum: ["online", "cash", null], default: null },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    slipPrintedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "" },

    // ── token system ──────────────────────────────────────────────
    tokenNumber: { type: Number, default: null },
    // true only while the order is "live" (not Completed/Cancelled). The unique
    // index below only applies to live orders, so a finished order's token can be reused.
    tokenActive: { type: Boolean, default: false },
    // self-ordering-kiosk orders are created hidden and revealed to the kitchen
    // only after the payment is verified
    visibleToKitchen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

orderSchema.index({ restaurantId: 1, createdAt: -1 });

// no two LIVE orders of one restaurant can hold the same token
orderSchema.index(
  { restaurantId: 1, tokenNumber: 1 },
  { unique: true, partialFilterExpression: { tokenActive: true } },
);

// ONE central rule: the moment an order becomes Completed/Cancelled its token
// is released. Controllers must use order.save() (not findOneAndUpdate) for
// status changes so this hook runs.
// orderSchema.pre("save", function (next) {
//   if (this.isModified("status") && ["Completed", "Cancelled"].includes(this.status)) {
//     this.tokenActive = false;
//   }
//   next();
// });


// FIXED — no callback needed for synchronous hooks
orderSchema.pre("save", function () {
  if (this.isModified("status") && ["Completed", "Cancelled"].includes(this.status)) {
    this.tokenActive = false;
  }
});




module.exports = mongoose.model("Order", orderSchema);


























// before kiosk
// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema({
//   menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
//   name: String,
//   price: Number, // snapshot at order time — immune to later menu price changes
//   qty: { type: Number, required: true, min: 1 },
//   isVeg: Boolean,
// });

// const orderSchema = new mongoose.Schema(
//   {
//     restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
//     sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
//     tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
//     customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
//     items: [orderItemSchema],

//     // full money breakdown, snapshotted at order time — a later change to
//     // the restaurant's GST% never rewrites the history of past orders
//     subtotal: { type: Number, required: true },
//     gstPercent: { type: Number, required: true },
//     gstAmount: { type: Number, required: true },
//     totalAmount: { type: Number, required: true }, // subtotal + gstAmount — actual amount charged

//     status: {
//       type: String,
//       enum: ["Pending", "Accepted", "Preparing", "Ready", "Served", "Completed", "Cancelled"],
//       default: "Pending",
//     },
//     paymentMethod: { type: String, enum: ["online", "cash", null], default: null },
//     paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
//     slipPrintedAt: { type: Date, default: null },
//     acceptedAt: { type: Date, default: null },
//     cancelledAt: { type: Date, default: null },
//     cancellationReason: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// orderSchema.index({ restaurantId: 1, createdAt: -1 });

// module.exports = mongoose.model("Order", orderSchema);