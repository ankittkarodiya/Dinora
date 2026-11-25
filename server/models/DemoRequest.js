const mongoose = require("mongoose");

const demoRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    // so you can track who you've already called
    status: {
      type: String,
      enum: ["new", "contacted", "done"],
      default: "new",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DemoRequest", demoRequestSchema);
