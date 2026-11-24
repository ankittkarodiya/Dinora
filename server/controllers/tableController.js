const Table = require("../models/Table");
const Restaurant = require("../models/Restaurant");
const { isProActive } = require("../utils/kioskAccess");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// ── GET /api/tables ───────────────────────────────────────────────
const getTables = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // const tables = await Table.find({ restaurantId }).sort({ createdAt: 1 });

    // new for counter order
    const tables = await Table.find({ restaurantId, isCounter: { $ne: true } }).sort({ createdAt: 1 });

    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── POST /api/tables ──────────────────────────────────────────────
const createTable = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // enforce plan's table limit
    // const currentCount = await Table.countDocuments({ restaurantId });

    // new for counter orders
    const currentCount = await Table.countDocuments({ restaurantId, isCounter: { $ne: true } });

    const maxAllowed = req.planLimits?.maxTables ?? 5;

    if (currentCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        message: `Your plan allows up to ${maxAllowed} tables. Upgrade to add more.`,
        code: "TABLE_LIMIT_REACHED",
      });
    }

    const { name, capacity } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Table name is required" });
    }

    const table = await Table.create({ restaurantId, name, capacity });
    res.status(201).json({ success: true, table });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── PATCH /api/tables/:id/kiosk ───────────────────────────────────
// body: { isKiosk: true|false }
// Self-ordering kiosk = PRO feature. Turning it OFF is always allowed.
const setTableKiosk = async (req, res) => {
  try {
    const { isKiosk } = req.body;
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (isKiosk) {
      // 1) Pro plan required
      if (!isProActive(restaurant)) {
        return res.status(403).json({
          success: false,
          code: "PRO_REQUIRED",
          message: "Self-ordering kiosk is a Pro feature. Upgrade your plan in Settings to use it.",
        });
      }
      // 2) a kiosk has NO cash option, so online payments must genuinely work
      if (!restaurant.razorpayLinked) {
        return res.status(400).json({
          success: false,
          code: "ONLINE_PAYMENTS_REQUIRED",
          message: "Self-ordering mode needs online payments. Link Razorpay first (Settings).",
        });
      }
    }

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { isKiosk: !!isKiosk },
      { returnDocument: "after" },
    );
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, table });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── DELETE /api/tables/:id ────────────────────────────────────────
const deleteTable = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);

    const table = await Table.findOneAndDelete({
      _id: req.params.id,
      restaurantId,
    });

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

module.exports = { getTables, createTable, setTableKiosk, deleteTable };
