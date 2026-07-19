const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

const getCategories = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) return res.status(404).json({ success: false, message: "Restaurant not found" });
    const categories = await Category.find({ restaurantId }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) return res.status(404).json({ success: false, message: "Restaurant not found" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
    const category = await Category.create({ restaurantId, name });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      { name },
      { new: true }
    );
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const category = await Category.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
















