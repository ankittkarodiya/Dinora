const Table = require("../models/Table");
const Restaurant = require("../models/Restaurant");

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

    const tables = await Table.find({ restaurantId }).sort({ createdAt: 1 });
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/tables ──────────────────────────────────────────────
// const createTable = async (req, res) => {
//   try {
//     const restaurantId = await getRestaurantId(req.user._id);
//     if (!restaurantId) {
//       return res.status(404).json({ success: false, message: "Restaurant not found" });
//     }

//     const { name, capacity } = req.body;
//     if (!name) {
//       return res.status(400).json({ success: false, message: "Table name is required" });
//     }

//     const table = await Table.create({ restaurantId, name, capacity });
//     res.status(201).json({ success: true, table });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const createTable = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // ← NEW: enforce plan's table limit
    const currentCount = await Table.countDocuments({ restaurantId });
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTables, createTable, deleteTable };