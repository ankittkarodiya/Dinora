const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const { cloudinary } = require("../config/cloudinary");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// public_id here is just "tableturn/menu-items/<file>" since we always
// upload menu item photos to that one fixed folder
const deleteCloudinaryImage = (imageUrl) => {
  if (!imageUrl) return;
  const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
  cloudinary.uploader
    .destroy(`tableturn/menu-items/${publicId}`)
    .catch((err) => console.error("Cloudinary cleanup failed (non-blocking):", err.message));
};

const getMenuItems = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    const items = await MenuItem.find({ restaurantId }).populate("categoryId", "name").sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const { name, description, price, categoryId, isVeg, isAvailable, isBestseller, image, portionSize } = req.body;
    if (!name || !price || !categoryId) {
      return res.status(400).json({ success: false, message: "Name, price and category are required" });
    }
    if (image && !/^https?:\/\//.test(image)) {
      return res.status(400).json({ success: false, message: "Invalid image URL" });
    }

    const item = await MenuItem.create({
      restaurantId, categoryId, name, description,
      price: Number(price),
      image: image || "",
      isVeg: !!isVeg,
      isAvailable: !!isAvailable,
      isBestseller: !!isBestseller,
      portionSize: portionSize || "", // ← new added

    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const { name, description, price, categoryId, isVeg, isAvailable, isBestseller, image, portionSize } = req.body;

    const existing = await MenuItem.findOne({ _id: req.params.id, restaurantId }).select("image");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const updateData = {
      name, description, price: Number(price), categoryId,
      isVeg: !!isVeg,
      isAvailable: !!isAvailable,
      isBestseller: !!isBestseller,
      portionSize: portionSize || "", // ← new added

    };

    let oldImageToClean = null;

    // "image" key present → the admin actually touched the photo this time
    if (Object.prototype.hasOwnProperty.call(req.body, "image")) {
      if (image && !/^https?:\/\//.test(image)) {
        return res.status(400).json({ success: false, message: "Invalid image URL" });
      }
      updateData.image = image;
      oldImageToClean = existing.image || null;
    }

    const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, restaurantId }, updateData, { new: true });

    res.json({ success: true, item });
    deleteCloudinaryImage(oldImageToClean);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Item deleted" });
    deleteCloudinaryImage(item.image);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability };






