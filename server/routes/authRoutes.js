const express = require("express");
const router = express.Router();
const { registerUser, verification, loginUser, getMe, logoutUser, forgetPassword, verifyOtp, changePassword } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const {validateUser, userSchema} = require('../validators/userValidate');
const isAuthenticated = require('../middlewares/isAuthenticatedMiddleware');
const { authLimiter } = require("../middlewares/rateLimiter");

router.post("/register", authLimiter, validateUser(userSchema), registerUser);
router.post("/verify", verification);
router.post("/login", authLimiter, loginUser);
router.post("/logout", isAuthenticated, logoutUser);
router.post('/forgot-password', authLimiter, forgetPassword);
router.post('/verify-otp/:email', authLimiter, verifyOtp);
router.post('/change-password/:email', authLimiter, changePassword);
router.get("/me", protect, getMe);

module.exports = router;