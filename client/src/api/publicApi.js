import axiosInstance from "./axiosInstance";

export const getMenuApi = async (slug, tableId) => {
  const res = await axiosInstance.get(`/public/menu/${slug}/${tableId}`);
  return res.data;
};

export const createSessionApi = async (data) => {
  const res = await axiosInstance.post("/public/session", data);
  return res.data;
};

export const placeOrderApi = async (data) => {
  const res = await axiosInstance.post("/public/orders", data);
  return res.data;
};

export const getSessionOrdersApi = async (sessionId) => {
  const res = await axiosInstance.get(`/public/orders/session/${sessionId}`);
  return res.data;
};

// For customer history
export const getCustomerOrderHistoryApi = async () => {
  const res = await axiosInstance.get("/public/orders/customer-history");
  return res.data;
};

export const getReviewableItemsApi = async (sessionId) => {
  const res = await axiosInstance.get(`/public/reviewable-items/${sessionId}`);
  return res.data;
};

// export const getItemReviewsApi = async (menuItemId) => {
//   const res = await axiosInstance.get(`/public/reviews/${menuItemId}`);
//   return res.data;
// };

// new
// get reviews for a specific menu item — public
export const getItemReviewsApi = async (menuItemId) => {
  const res = await axiosInstance.get(`/public/reviews/${menuItemId}`);
  return res.data;
};

// export const submitReviewApi = async (data) => {
//   const res = await axiosInstance.post("/public/reviews", data);
//   return res.data;
// };

// new
// submit review — customer must be logged in
export const submitReviewApi = async (data) => {
  // data = { restaurantId, menuItemId, sessionId, rating, text }
  const res = await axiosInstance.post("/public/reviews", data);
  return res.data;
};

export const createPaymentOrderApi = async (data) => {
  const res = await axiosInstance.post("/public/payment/create-order", data);
  return res.data;
};

export const verifyPaymentApi = async (data) => {
  const res = await axiosInstance.post("/public/payment/verify", data);
  return res.data;
};

// export const markCashPaymentApi = async (data) => {
//   const res = await axiosInstance.post("/public/payment/cash", data);
//   return res.data;
// };

// customer requests cash — does NOT complete the order
export const requestCashPaymentApi = async (data) => {
  const res = await axiosInstance.post("/public/payment/cash-request", data);
  return res.data;
};

// new
// checks if online payment is even possible BEFORE any order exists —
// no order/session dependency, just "is this restaurant Pro + Razorpay linked"
export const createPaymentOrderPreflightApi = async (data) => {
  const res = await axiosInstance.post("/public/payment/preflight", data);
  return res.data;
};

// new
export const cancelUnpaidOrderApi = async (orderId) => {
  const res = await axiosInstance.patch(`/public/orders/${orderId}/cancel-unpaid`);
  return res.data;
};



























// import axiosInstance from "./axiosInstance";

// export const getMenuApi = async (slug, tableId) => {
//   const res = await axiosInstance.get(`/public/menu/${slug}/${tableId}`);
//   return res.data;
// };

// export const createSessionApi = async (data) => {
//   const res = await axiosInstance.post("/public/session", data);
//   return res.data;
// };

// export const placeOrderApi = async (data) => {
//   const res = await axiosInstance.post("/public/orders", data);
//   return res.data;
// };

// export const getSessionOrdersApi = async (sessionId) => {
//   const res = await axiosInstance.get(`/public/orders/session/${sessionId}`);
//   return res.data;
// };

// export const getReviewableItemsApi = async (sessionId) => {
//   const res = await axiosInstance.get(`/public/reviewable-items/${sessionId}`);
//   return res.data;
// };

// export const submitReviewApi = async (data) => {
//   const res = await axiosInstance.post("/public/reviews", data);
//   return res.data;
// };

// export const getItemReviewsApi = async (menuItemId) => {
//   const res = await axiosInstance.get(`/public/reviews/${menuItemId}`);
//   return res.data;
// };

























// import axiosInstance from "./axiosInstance";

// // called when customer scans QR
// export const getMenuApi = async (slug, tableId) => {
//   const res = await axiosInstance.get(`/public/menu/${slug}/${tableId}`);
//   return res.data;
// };

// // creates dining session
// export const createSessionApi = async (data) => {
//   const res = await axiosInstance.post("/public/session", data);
//   return res.data;
// };

// // customer places order
// export const placeOrderApi = async (data) => {
//   const res = await axiosInstance.post("/public/orders", data);
//   return res.data;
// };

// // customer tracks orders
// export const getSessionOrdersApi = async (sessionId) => {
//   const res = await axiosInstance.get(`/public/orders/session/${sessionId}`);
//   return res.data;
// };

// // get reviews for a menu item
// export const getItemReviewsApi = async (menuItemId) => {
//   const res = await axiosInstance.get(`/public/reviews/${menuItemId}`);
//   return res.data;
// };

// // submit review — customer must be logged in
// export const submitReviewApi = async (data) => {
//   const res = await axiosInstance.post("/public/reviews", data);
//   return res.data;
// };