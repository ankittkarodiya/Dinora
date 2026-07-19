import axiosInstance from "./axiosInstance";

export const getOrdersApi = async () => {
  const res = await axiosInstance.get("/orders");
  return res.data;
};

export const acceptOrderApi = async (id) => {
  const res = await axiosInstance.patch(`/orders/${id}/accept`);
  return res.data;
};

export const markSlipPrintedApi = async (id) => {
  const res = await axiosInstance.patch(`/orders/${id}/print`);
  return res.data;
};

export const updateOrderStatusApi = async (id, status) => {
  const res = await axiosInstance.patch(`/orders/${id}/status`, { status });
  return res.data;
};

export const cancelOrderApi = async (id, reason) => {
  const res = await axiosInstance.patch(`/orders/${id}/cancel`, { reason });
  return res.data;
};

// admin confirms cash received
export const confirmCashPaymentApi = async (orderId) => {
  const res = await axiosInstance.patch(`/orders/${orderId}/confirm-cash`);
  return res.data;
};

























// import axiosInstance from "./axiosInstance";

// export const getOrdersApi = async () => {
//   const res = await axiosInstance.get("/orders");
//   return res.data;
// };

// export const updateOrderStatusApi = async (id, status) => {
//   const res = await axiosInstance.patch(`/orders/${id}/status`, { status });
//   return res.data;
// };

// // new
// export const cancelOrderApi = async (id, reason) => {
//   const res = await axiosInstance.patch(`/orders/${id}/cancel`, { reason });
//   return res.data;
// };