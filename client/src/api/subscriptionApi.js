import axiosInstance from "./axiosInstance";

// export const createSubscriptionOrderApi = async (plan) => {
//   const res = await axiosInstance.post("/subscription/create-order", { plan, billingCycle });
//   return res.data;
// };

export const createSubscriptionOrderApi = async (plan, billingCycle = "monthly") => {
  const res = await axiosInstance.post("/subscription/create-order", { plan, billingCycle });
  return res.data;
};

export const verifySubscriptionApi = async (data) => {
  const res = await axiosInstance.post("/subscription/verify", data);
  return res.data;
};

export const getSubscriptionStatusApi = async () => {
  const res = await axiosInstance.get("/subscription/status");
  return res.data;
};

export const addRazorpayKeysApi = async (data) => {
  const res = await axiosInstance.post("/subscription/add-razorpay", data);
  return res.data;
};




















// import axiosInstance from "./axiosInstance";

// export const createSubscriptionOrderApi = async (plan) => {
//   const res = await axiosInstance.post("/subscription/create-order", { plan });
//   return res.data;
// };

// export const verifySubscriptionApi = async (data) => {
//   const res = await axiosInstance.post("/subscription/verify", data);
//   return res.data;
// };

// export const getSubscriptionStatusApi = async () => {
//   const res = await axiosInstance.get("/subscription/status");
//   return res.data;
// };

// export const addRazorpayKeysApi = async (data) => {
//   const res = await axiosInstance.post("/subscription/add-razorpay", data);
//   return res.data;
// };