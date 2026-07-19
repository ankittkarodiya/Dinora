const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    // each customer belongs to one restaurant
    // same phone can register in different restaurants as separate customers
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// unique per phone + restaurant combination
customerSchema.index({ phone: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model("Customer", customerSchema);

























// const mongoose = require("mongoose");

// const customerSchema = new mongoose.Schema(
//   {
//     phone: {
//       type: String,
//       required: [true, "Phone number is required"],
//       unique: true,
//       trim: true,
//     },
//     username: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     isActive: {
//       type: Boolean,
//       default: true, // account enabled/disabled by admin
//     },
//     // new
//     isOnline: {
//       type: Boolean,
//       default: false, // true when logged in, false when logged out
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Customer", customerSchema);