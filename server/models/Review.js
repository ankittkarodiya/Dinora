const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// You said you want MULTIPLE reviews per customer allowed
// So do NOT put a unique index at all — remove any unique constraint
reviewSchema.index({ menuItemId: 1, customerId: 1 }); // regular index for fast lookup, NOT unique

module.exports = mongoose.model("Review", reviewSchema);











// const mongoose = require("mongoose");

// const reviewSchema = new mongoose.Schema(
//   {
//     restaurantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//     },
//     menuItemId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "MenuItem",
//       required: true,
//     },
//     customerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     customerName: {
//       type: String,
//       required: true,
//       default: "Guest",
//     },
//     rating: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 5,
//     },
//     text: {
//       type: String,
//       default: "",
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// // one review per customer per item
// reviewSchema.index({ menuItemId: 1, customerId: 1 }, { unique: true });

// module.exports = mongoose.model("Review", reviewSchema);