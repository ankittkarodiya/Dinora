import axiosInstance from "./axiosInstance";

export const checkPhoneApi = async (phone, restaurantId) => {
  const res = await axiosInstance.post("/customer/check-phone", { phone, restaurantId });
  return res.data;
};

export const customerRegisterApi = async ({ phone, username, restaurantId }) => {
  const res = await axiosInstance.post("/customer/register", { phone, username, restaurantId });
  return res.data;
};

export const customerLoginApi = async ({ phone, restaurantId }) => {
  const res = await axiosInstance.post("/customer/login", { phone, restaurantId });
  return res.data;
};

export const customerLogoutApi = async () => {
  const res = await axiosInstance.post("/customer/logout");
  return res.data;
};

export const getCustomerMeApi = async () => {
  const res = await axiosInstance.get("/customer/me");
  return res.data;
};

export const identifyCustomerApi = async (data) => {
  const res = await axiosInstance.post("/customer/identify", data);
  return res.data;
};
