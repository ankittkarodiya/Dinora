import axiosInstance from "./axiosInstance";

export const subscribePushApi = async (subscription) => {
  const res = await axiosInstance.post("/push/subscribe", subscription.toJSON());
  return res.data;
};

export const unsubscribePushApi = async (endpoint) => {
  const res = await axiosInstance.post("/push/unsubscribe", { endpoint });
  return res.data;
};