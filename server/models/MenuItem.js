const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },

    halfPrice: {
      type: Number,
      default: null
    },

    image: {
      type: String,
      default: "",
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);

// menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);