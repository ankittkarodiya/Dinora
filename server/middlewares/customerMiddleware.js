const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Restaurant = require("../models/Restaurant");

// Blocks review writing if the restaurant isn't on Pro.
// Does NOT touch login, register, or order history — those stay open on every plan.
const requireProForReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "restaurantId is required" });
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.subscriptionPlan !== "pro" || restaurant.subscriptionStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "This restaurant hasn't enabled reviews yet.",
        code: "FEATURE_LOCKED",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// separate middleware for customer routes — uses Customer model not User
const protectCustomer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // customer tokens have customerId field
    if (!decoded.customerId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    const customer = await Customer.findById(decoded.customerId);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // attach customer to req
    req.customer = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

// optional — does not block if no token
// just attaches customer to req if token exists
const optionalCustomer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.customerId) {
        req.customer = await Customer.findById(decoded.customerId);
      }
    } catch {
      // invalid token — just ignore, req.customer stays undefined
    }
  }

  next();
};

module.exports = { protectCustomer, optionalCustomer, requireProForReviews };
