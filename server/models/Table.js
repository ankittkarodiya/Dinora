const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Table name is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    // Self-ordering kiosk flag. A "table" marked as kiosk opens the same menu
    // URL, but the customer app hides login/cash/tracking and the server
    // refuses cash for its orders. Existing tables default to false, so
    // nothing changes for them.
    isKiosk: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);

























// const mongoose = require("mongoose");

// const tableSchema = new mongoose.Schema(
//   {
//     restaurantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//     },
//     name: {
//       type: String,
//       required: [true, "Table name is required"],
//       trim: true,
//     },
//     capacity: {
//       type: Number,
//       default: 4,
//     },
//     isOccupied: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Table", tableSchema);