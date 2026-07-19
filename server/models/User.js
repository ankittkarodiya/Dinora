const mongoose = require("mongoose");
const { Schema, model } = mongoose;
// const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    // lowercase: true,
    // trim: true,
  //   match: [
  //   /^[a-z0-9_]+$/,
  //   "Username can contain only lowercase letters, numbers, and underscores"
  // ]
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    // required: true,
    select: false //read about it
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
    // required: true,
    // select: false //read about it
  },
  avatar: {
    type: String,
    // required: true,
    // select: false //read about it
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  otpExp: {
    type: Date,
    default: null
  },

  role: {
  type: String,
  enum: ["superadmin", "restaurant_admin", "customer"],
  default: "customer"
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },
  // add this field to your existing User schema
  currentSessionToken: {
  type: String,
  default: null,
  },

}, { timestamps: true });


const User = model("User", userSchema)

module.exports = User