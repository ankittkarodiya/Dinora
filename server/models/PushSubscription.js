const mongoose = require("mongoose");

// One document per device that's subscribed to push notifications for a
// given restaurant. A single admin using two devices (phone + laptop)
// will have two separate documents here — both get notified.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true, // the browser's push endpoint URL — naturally unique per device+browser
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);