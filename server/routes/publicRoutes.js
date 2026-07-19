const express = require("express");
const router = express.Router();
const {
  getMenu, createSession, placeOrder, getSessionOrders,
  getReviewableItems, submitReview, getItemReviews, getCustomerOrderHistory
} = require("../controllers/publicController");

const { preflightCheck, createPaymentOrder, verifyPayment, requestCashPayment } = require("../controllers/paymentController");
// const { preflightCheck, createPaymentOrder, verifyPayment, markCashPayment, requestCashPayment } = require("../controllers/paymentController");

const { protectCustomer, optionalCustomer, requireProForReviews } = require("../middlewares/customerMiddleware");

router.get("/menu/:slug/:tableId", getMenu);
router.post("/session", createSession);
router.post("/orders", optionalCustomer, placeOrder);
router.get("/orders/session/:sessionId", optionalCustomer, getSessionOrders);
router.get("/reviewable-items/:sessionId", optionalCustomer, getReviewableItems);
router.get("/reviews/:menuItemId", getItemReviews);

// router.post("/reviews", protectCustomer, submitReview);

// ← ONLY this one route gets the Pro gate — login, register, and order history are untouched
router.post("/reviews", protectCustomer, requireProForReviews, submitReview);

// customer's full order history — must be logged in
router.get("/orders/customer-history", protectCustomer, getCustomerOrderHistory);

// payment
router.post("/payment/create-order", createPaymentOrder);
router.post("/payment/verify", verifyPayment);
// router.post("/payment/cash", markCashPayment);
router.post("/payment/cash-request", requestCashPayment); // customer requests cash

router.post("/payment/preflight", preflightCheck);


module.exports = router;

