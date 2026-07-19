const express = require("express");
const router = express.Router();
const {
  getMenuItems, createMenuItem, updateMenuItem,
  deleteMenuItem, toggleAvailability,
} = require("../controllers/menuItemController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { checkSubscription } = require("../middlewares/checkSubscription");

router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription);

router.get("/", getMenuItems);
router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);
router.patch("/:id/toggle", toggleAvailability);

module.exports = router;


