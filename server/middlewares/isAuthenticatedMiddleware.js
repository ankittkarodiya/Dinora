const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access token is missing or invalid" });
    }
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ success: false, message: "Access Token has expired, use Refresh Token to generate again" });
      }
      return res.status(400).json({ success: false, message: "Access Token is missing or invalid" });
    }

    const { userId, sessionToken } = decoded;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    // ← new: an account deactivated mid-session gets kicked out on its very
    // next request, not just blocked from logging in again later
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }


    // ← added: was missing entirely, so single-device login was never enforced
    if (sessionToken && sessionToken !== user.currentSessionToken) {
      return res.status(401).json({
        success: false,
        message: "Signed in on another device",
        code: "SESSION_INVALIDATED",
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = isAuthenticated;




