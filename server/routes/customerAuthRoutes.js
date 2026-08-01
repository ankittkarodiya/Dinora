const express = require("express");
const router = express.Router();
const { checkPhone, registerHandler, loginHandler, logoutHandler, getCustomerMe, identifyCustomer } = require("../controllers/customerAuthController");
const { protectCustomer } = require("../middlewares/customerMiddleware");

router.post("/check-phone", checkPhone);
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/logout", protectCustomer, logoutHandler);
router.get("/me", protectCustomer, getCustomerMe);

router.post("/identify", identifyCustomer);

module.exports = router;


