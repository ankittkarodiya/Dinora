const express = require("express");
const router = express.Router();
const {
  getOrders, acceptOrder, markSlipPrinted,
  updateOrderStatus, cancelOrder,
} = require("../controllers/orderController");

const { confirmCashPayment } = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const { checkSubscription } = require("../middlewares/checkSubscription");

router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription); // ← add this after authorize

router.get("/", getOrders);
router.patch("/:id/accept", acceptOrder);
router.patch("/:id/print", markSlipPrinted);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/confirm-cash", confirmCashPayment); // admin confirms cash


module.exports = router;



