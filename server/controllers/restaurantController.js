const Restaurant = require("../models/Restaurant");

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const { name, slug, description, phone, address, gstPercent, gstNumber, plan } = req.body;

    const existing = await Restaurant.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already have a restaurant" });
    }

    const slugTaken = await Restaurant.findOne({ slug });
    if (slugTaken) {
      return res.status(400).json({ success: false, message: "Slug already taken" });
    }

    // plan is required — the restaurant is never created without one being chosen,
    // "trial" must be an explicit choice from the frontend, not a schema default
    const validPlans = ["trial", "basic", "pro"];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: "A plan must be selected" });
    }

    const restaurant = await Restaurant.create({
      userId: req.user._id,
      name, slug, description, phone, address,
      gstPercent: gstPercent ? Number(gstPercent) : 5,
      gstNumber: gstNumber || "",
      subscriptionPlan: plan,
      // for trial, expiry is set by schema default (4 days from now)
      // for basic/pro, subscription is not "active" until payment verifies —
      // see verifySubscription in subscriptionController for that transition
      subscriptionStatus: plan === "trial" ? "active" : "expired",
    });

    res.status(201).json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { name, description, phone, address, gstNumber, gstPercent } = req.body;
    const updateData = { name, description, phone, address, gstNumber };
    if (gstPercent !== undefined && gstPercent !== "") {
      updateData.gstPercent = Number(gstPercent);
    }
    const restaurant = await Restaurant.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// logo removed entirely — no uploadLogo function

module.exports = { getMyRestaurant, createRestaurant, updateRestaurant };

