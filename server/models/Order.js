const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: String,
  price: Number, // snapshot at order time — immune to later menu price changes
  qty: { type: Number, required: true, min: 1 },
  isVeg: Boolean,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

























// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema({
//   menuItemId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "MenuItem",
//     required: true,
//   },
//   name: String,
//   price: Number,
//   qty: { type: Number, required: true, min: 1 },
//   isVeg: Boolean,
// });

// const orderSchema = new mongoose.Schema(
//   {
//     restaurantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//     },
//     sessionId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Session",
//       required: true,
//     },
//     tableId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table",
//       required: true,
//     },
//     customerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       default: null, // null if customer not logged in
//     },
//     items: [orderItemSchema],
//     totalAmount: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: ["Pending", "Accepted", "Preparing", "Ready", "Served", "Completed", "Cancelled"],
//       default: "Pending",
//     },
//     // new
//     // payment info — set when customer pays
//     paymentMethod: {
//       type: String,
//       enum: ["online", "cash", null],
//       default: null,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid"],
//       default: "pending",
//     },
//     // slip info
//     slipPrintedAt: { type: Date, default: null },
//     acceptedAt: { type: Date, default: null },
//     cancelledAt: { type: Date, default: null },
//     cancellationReason: { type: String, default: "" },
    
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);




















// // const mongoose = require("mongoose");

// // const orderItemSchema = new mongoose.Schema({
// //   menuItemId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "MenuItem",
// //     required: true,
// //   },
// //   name: String,   // store name at time of order in case item is deleted later
// //   price: Number,  // store price at time of order
// //   qty: {
// //     type: Number,
// //     required: true,
// //     min: 1,
// //   },
// //   isVeg: Boolean,
// // });

// // const orderSchema = new mongoose.Schema(
// //   {
// //     restaurantId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Restaurant",
// //       required: true,
// //     },
// //     sessionId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Session",
// //       required: true,
// //     },
// //     tableId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Table",
// //       required: true,
// //     },
// //     items: [orderItemSchema],
// //     totalAmount: {
// //       type: Number,
// //       required: true,
// //     },
// //     status: {
// //       type: String,
// //       enum: ["Pending", "Preparing", "Ready", "Served", "Completed"],
// //       default: "Pending",
// //     },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("Order", orderSchema);