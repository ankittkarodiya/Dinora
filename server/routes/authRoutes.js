const express = require("express");
const router = express.Router();
const { registerUser, verification, loginUser, getMe, logoutUser, forgetPassword, verifyOtp, changePassword } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const {validateUser, userSchema} = require('../validators/userValidate');
const isAuthenticated = require('../middlewares/isAuthenticatedMiddleware');

// const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post("/register", validateUser(userSchema), registerUser);
router.post("/verify", verification);
router.post("/login", loginUser);
router.post("/logout", isAuthenticated, logoutUser);
router.post('/forgot-password', forgetPassword);
router.post('/verify-otp/:email', verifyOtp);
router.post('/change-password/:email', changePassword);
router.get("/me", protect, getMe);

// step1 - redirect to google login
// router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// router.get("/google/callback",
//     passport.authenticate("google", {session:false}),
//     (req, res) => {
//         try {
//             const token = jwt.sign({id: req.user._id, email: req.user.email}, process.env.JWT_SECRET, {expiresIn: "7d"});

//             res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`)
//         } catch (error) {
//             console.error("Google login error:", error);
//             res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
//         }
//     }
// );





// router.get("/me", isAuthenticated, (req, res) => {
//     res.json({
//         success: true,
//         user: req.user
//     })
// });


module.exports = router;