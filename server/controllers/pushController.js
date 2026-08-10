const PushSubscription = require("../models/PushSubscription");
const Restaurant = require("../models/Restaurant");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// POST /api/push/subscribe
// Called once per device, right after the admin grants notification
// permission. Saves (or updates) that device's subscription.
const subscribe = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: "Invalid subscription" });
    }

    // upsert — if this exact device/browser already has a subscription
    // saved (e.g. re-subscribing after clearing site data), update it
    // in place rather than creating a duplicate
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { restaurantId, endpoint, keys },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Subscribed to push notifications" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/push/unsubscribe
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "Endpoint required" });
    }
    await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true, message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { subscribe, unsubscribe };