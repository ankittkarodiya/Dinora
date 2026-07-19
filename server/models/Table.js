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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);