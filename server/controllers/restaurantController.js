const Restaurant = require("../models/Restaurant");

const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const { name, slug, description, phone, address, gstPercent, gstNumber, plan } = req.body;

    const existing = await Restaurant.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already have a restaurant" });
    }


    // new
    // the URL name must be clean, and can't clash with the app's own pages
    const RESERVED_SLUGS = [
      "login", "register", "register-verification", "verification",
      "forgot-password", "verify-email", "change-password", "menu",
      "customer", "superadmin", "restaurant", "setup", "api", "admin",
      "dashboard", "settings", "orders", "tables", "analytics", "reviews",
      "categories", "counter", "about", "pricing", "contact", "terms",
      "privacy", "help", "support", "assets", "static", "new", "www",
    ];
    const cleanSlug = String(slug || "").trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      return res.status(400).json({ success: false, message: "Use only letters, numbers and hyphens in the URL name" });
    }
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      return res.status(400).json({ success: false, message: "This URL name is reserved, please pick another" });
    }


    // const slugTaken = await Restaurant.findOne({ slug });
    // new
    const slugTaken = await Restaurant.findOne({ slug: cleanSlug });

    if (slugTaken) {
      return res.status(400).json({ success: false, message: "Slug already taken" });
    }

    // plan is required — the restaurant is never created without one being chosen,
    // "trial" must be an explicit choice from the frontend, not a schema default
    const validPlans = ["trial", "basic", "pro"];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: "A plan must be selected" });
    }

    // const finalGstPercent = gstPercent ? Number(gstPercent) : 5;
    // new
    const finalGstPercent = gstPercent !== undefined && gstPercent !== "" ? Number(gstPercent) : 5;

    const restaurant = await Restaurant.create({
      userId: req.user._id,
      name,

      // slug,
      // new
      slug: cleanSlug,

      description,
      phone,
      address,
      // gstPercent: gstPercent ? Number(gstPercent) : 5,
      // new
      gstPercent: finalGstPercent,

      cgstPercent: finalGstPercent / 2,
      sgstPercent: finalGstPercent / 2,
      gstNumber: gstNumber || "",
      subscriptionPlan: plan,
      subscriptionBillingCycle: plan === "trial" ? "none" : "monthly",
      // for trial, expiry is set by schema default (4 days from now)
      // for basic/pro, subscription is not "active" until payment verifies
      subscriptionStatus: plan === "trial" ? "active" : "expired",
    });

    res.status(201).json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { name, description, phone, address, gstNumber, gstPercent, tokenLimit } = req.body;
    const updateData = { name, description, phone, address, gstNumber };
    if (gstPercent !== undefined && gstPercent !== "") {
      const gst = Number(gstPercent);

      // new
      if (isNaN(gst) || gst < 0 || gst > 100) {
        return res.status(400).json({ success: false, message: "GST must be between 0 and 100" });
      }

      updateData.gstPercent = gst;
      updateData.cgstPercent = gst / 2;
      updateData.sgstPercent = gst / 2;
    }

    // owner-set token limit. Whole number 1-999. Orders are still
    // accepted past this (limit+1...); the limit only drives the owner's warning.
    if (tokenLimit !== undefined && tokenLimit !== "") {
      const limit = Number(tokenLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 999) {
        return res.status(400).json({
          success: false,
          message: "Token limit must be a whole number between 1 and 999",
        });
      }
      updateData.tokenLimit = limit;
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
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

module.exports = { getMyRestaurant, createRestaurant, updateRestaurant };
