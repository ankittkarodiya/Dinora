const express = require("express");
const router = express.Router();
const {
  createSubscriptionOrder, verifySubscription,
  getSubscriptionStatus, addRazorpayKeys,
} = require("../controllers/subscriptionController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);
router.use(authorize("restaurant_admin"));

router.post("/create-order", createSubscriptionOrder);
router.post("/verify", verifySubscription);
router.get("/status", getSubscriptionStatus);
router.post("/add-razorpay", addRazorpayKeys);

module.exports = router;