const express = require("express");
const router = express.Router();
const { getAnalytics } = require("../controllers/analyticsController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const { checkSubscription, requireFeature } = require("../middlewares/checkSubscription");

router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription); // ← add this after authorize
router.use(requireFeature("analytics")); // ← Pro only

router.get("/", getAnalytics);

module.exports = router;