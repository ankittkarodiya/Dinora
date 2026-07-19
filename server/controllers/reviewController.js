const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");

const getRestaurantId = async (userId) => {
  const restaurant = await Restaurant.findOne({ userId });
  return restaurant?._id || null;
};

// GET /api/reviews
// Admin gets all reviews for their restaurant
const getReviews = async (req, res) => {
  try {
    const restaurantId = await getRestaurantId(req.user._id);
    if (!restaurantId) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const reviews = await Review.find({ restaurantId })
      .populate("menuItemId", "name image")
      .sort({ createdAt: -1 });

    // calculate avg per item
    const itemStats = {};
    reviews.forEach((r) => {
      const id = r.menuItemId?._id?.toString() || r.menuItemId?.toString();
      if (!id) return;
      if (!itemStats[id]) {
        itemStats[id] = {
          itemId: id,
          itemName: r.menuItemId?.name || "Unknown",
          itemImage: r.menuItemId?.image || "",
          reviews: [],
          totalRating: 0,
        };
      }
      itemStats[id].reviews.push(r);
      itemStats[id].totalRating += r.rating;
    });

    const groupedByItem = Object.values(itemStats).map((stat) => ({
      ...stat,
      avgRating: (stat.totalRating / stat.reviews.length).toFixed(1),
      reviewCount: stat.reviews.length,
    })).sort((a, b) => b.reviewCount - a.reviewCount);

    const overallAvg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({
      success: true,
      reviews,
      groupedByItem,
      totalReviews: reviews.length,
      overallAvg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReviews };



