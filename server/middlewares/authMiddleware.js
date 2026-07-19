const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: your token now signs { userId, sessionToken }, not { id }
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }




    if (decoded.sessionToken && decoded.sessionToken !== user.currentSessionToken) {
  return res.status(401).json({
    success: false,
    message: "Logged out — this account was signed in on another device",
    code: "SESSION_INVALIDATED",
  });
}




    // While we're here — actually enforce the single-device session
    // your loginUser already generates sessionToken and saves it to the user,
    // but nothing was checking it against the token until now
    // if (decoded.sessionToken && decoded.sessionToken !== user.currentSessionToken) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Logged out — this account was signed in on another device",
    //     code: "SESSION_INVALIDATED",
    //   });
    // }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

module.exports = { protect };
