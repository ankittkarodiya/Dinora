const Restaurant = require("../models/Restaurant");

const PLAN_LIMITS = {
  trial: { maxTables: 5, analytics: false, reviews: false, onlinePayments: false },
  basic: { maxTables: 10, analytics: false, reviews: false, onlinePayments: true },
  // basic: { maxTables: 10, analytics: false, reviews: false, onlinePayments: true },
  pro:   { maxTables: 30, analytics: true,  reviews: true,  onlinePayments: true  },
};

const checkSubscription = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ userId: req.user._id });
    if (!restaurant) return next();

    const isExpired = restaurant.subscriptionExpiresAt < new Date();
    if (isExpired) {
      if (restaurant.subscriptionStatus !== "expired") {
        await Restaurant.findByIdAndUpdate(restaurant._id, { subscriptionStatus: "expired" });
      }
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew to continue.",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // attach plan limits to req so downstream controllers can check them
    req.planLimits = PLAN_LIMITS[restaurant.subscriptionPlan] || PLAN_LIMITS.trial;
    req.restaurantDoc = restaurant;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Feature-specific gate — blocks a route entirely if the plan doesn't include it
const requireFeature = (featureKey) => (req, res, next) => {
  if (!req.planLimits?.[featureKey]) {
    return res.status(403).json({
      success: false,
      message: `This feature requires the Pro plan.`,
      code: "FEATURE_LOCKED",
    });
  }
  next();
};

module.exports = { checkSubscription, requireFeature, PLAN_LIMITS };

























// const Restaurant = require("../models/Restaurant");

// // Blocks access if subscription expired — applied to restaurant-only routes
// const checkSubscription = async (req, res, next) => {
//   try {
//     const restaurant = await Restaurant.findOne({ userId: req.user._id });
//     if (!restaurant) return next(); // let setup flow handle "no restaurant yet"

//     const isExpired = restaurant.subscriptionExpiresAt < new Date();
//     if (isExpired) {
//       if (restaurant.subscriptionStatus !== "expired") {
//         await Restaurant.findByIdAndUpdate(restaurant._id, { subscriptionStatus: "expired" });
//       }
//       return res.status(403).json({
//         success: false,
//         message: "Your subscription has expired. Please renew to continue.",
//         code: "SUBSCRIPTION_EXPIRED",
//       });
//     }

//     next();
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { checkSubscription };