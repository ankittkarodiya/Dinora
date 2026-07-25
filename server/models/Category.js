const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    // emoji: {
    //   type: String,
    //   default: "🍽️",
    // }, //i dont want any emoji or image for category
    order: {
      type: Number,
      default: 0, // for sorting categories
    },
  },
  { timestamps: true }
);

categorySchema.index({ restaurantId: 1 });

module.exports = mongoose.model("Category", categorySchema);