const express = require("express");
const router = express.Router();
const { checkPhone, registerHandler, loginHandler, logoutHandler, getCustomerMe, identifyCustomer } = require("../controllers/customerAuthController");
const { protectCustomer } = require("../middlewares/customerMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");

router.post("/check-phone", authLimiter, checkPhone);
router.post("/register", authLimiter, registerHandler);
router.post("/login", authLimiter, loginHandler);
router.post("/logout", protectCustomer, logoutHandler);
router.get("/me", protectCustomer, getCustomerMe);

router.post("/identify", authLimiter, identifyCustomer);

module.exports = router;
