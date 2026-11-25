const express = require("express");
const router = express.Router();
const {
  getMenu, createSession, placeOrder, cancelUnpaidOrder, getSessionOrders,
  getReviewableItems, submitReview, getItemReviews, getCustomerOrderHistory, getRestaurantManifest
} = require("../controllers/publicController");

const { preflightCheck, createPaymentOrder, verifyPayment, requestCashPayment } = require("../controllers/paymentController");

const { protectCustomer, optionalCustomer, requireProForReviews } = require("../middlewares/customerMiddleware");
const { paymentLimiter } = require("../middlewares/rateLimiter");

router.get("/menu/:slug/:tableId", getMenu);
router.post("/session", createSession);
router.post("/orders", optionalCustomer, placeOrder);
router.get("/orders/session/:sessionId", optionalCustomer, getSessionOrders);
router.get("/reviewable-items/:sessionId", optionalCustomer, getReviewableItems);
router.get("/reviews/:menuItemId", getItemReviews);

router.patch("/orders/:id/cancel-unpaid", optionalCustomer, cancelUnpaidOrder);

router.post("/reviews", protectCustomer, requireProForReviews, submitReview);

// customer's full order history — must be logged in
router.get("/orders/customer-history", protectCustomer, getCustomerOrderHistory);

// payment — rate-limited + optional auth
router.post("/payment/create-order", paymentLimiter, optionalCustomer, createPaymentOrder);
router.post("/payment/verify", paymentLimiter, optionalCustomer, verifyPayment);
router.post("/payment/cash-request", paymentLimiter, optionalCustomer, requestCashPayment);

router.post("/payment/preflight", optionalCustomer, preflightCheck);

// new for pwa fix
router.get("/manifest/:slug", getRestaurantManifest);

module.exports = router;
