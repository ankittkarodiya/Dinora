const express = require("express");
const router = express.Router();
const { getReviews } = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const { checkSubscription, requireFeature } = require("../middlewares/checkSubscription");

router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription); // ← add this after authorize
router.use(requireFeature("reviews")); // ← Pro only

router.get("/", getReviews);

module.exports = router;



