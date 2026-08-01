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

// new
export const identifyCustomerApi = async (data) => {
  const res = await axiosInstance.post("/customer/identify", data);
  return res.data;
};



















// import axiosInstance from "./axiosInstance";

// // export const checkPhoneApi = async (phone) => {
// //   const res = await axiosInstance.post("/customer/check-phone", { phone });
// //   return res.data;
// // };

// export const checkPhoneApi = async (phone, restaurantId) => {
//   const res = await axiosInstance.post("/customer/check-phone", { phone, restaurantId });
//   return res.data;
// };

// export const sendOtpApi = async (phone) => {
//   const res = await axiosInstance.post("/customer/send-otp", { phone });
//   return res.data;
// };

// export const customerRegisterApi = async (data) => {
//   const res = await axiosInstance.post("/customer/register", data);
//   return res.data;
// };

// export const customerLoginApi = async (data) => {
//   const res = await axiosInstance.post("/customer/login", data);
//   return res.data;
// };

// export const customerLogoutApi = async () => {
//   const res = await axiosInstance.post("/customer/logout");
//   return res.data;
// };

// export const getCustomerMeApi = async () => {
//   const res = await axiosInstance.get("/customer/me");
//   return res.data;
// };

// export const verifyFirebasePhoneApi = async (data) => {
//   const res = await axiosInstance.post("/customer/firebase-login", data);
//   return res.data;
// };





















// import axiosInstance from "./axiosInstance";

// export const sendOtpApi = async (phone) => {
//   const res = await axiosInstance.post("/customer/send-otp", { phone });
//   return res.data;
// };

// export const customerRegisterApi = async (data) => {
//   // data = { phone, otp, username }
//   const res = await axiosInstance.post("/customer/register", data);
//   return res.data;
// };

// export const customerLoginApi = async (data) => {
//   // data = { phone, otp }
//   const res = await axiosInstance.post("/customer/login", data);
//   return res.data;
// };

// export const customerLogoutApi = async () => {
//   const res = await axiosInstance.post("/customer/logout");
//   return res.data;
// };

// export const getCustomerMeApi = async () => {
//   const res = await axiosInstance.get("/customer/me");
//   return res.data;
// };












// import axiosInstance from "./axiosInstance";

// export const sendOtpApi = async (phone) => {
//   const res = await axiosInstance.post("/customer/send-otp", { phone });
//   return res.data;
// };

// export const verifyOtpApi = async (data) => {
//   // data = { phone, otp }
//   const res = await axiosInstance.post("/customer/verify-otp", data);
//   return res.data;
// };

// export const updateCustomerProfileApi = async (data) => {
//   const res = await axiosInstance.put("/customer/profile", data);
//   return res.data;
// };

// export const getCustomerMeApi = async () => {
//   const res = await axiosInstance.get("/customer/me");
//   return res.data;
// };
























// import axiosInstance from "./axiosInstance";

// export const customerRegisterApi = async (data) => {
//   const res = await axiosInstance.post("/customer/register", data);
//   return res.data;
// };

// export const customerLoginApi = async (data) => {
//   const res = await axiosInstance.post("/customer/login", data);
//   return res.data;
// };

// export const getCustomerMeApi = async () => {
//   const res = await axiosInstance.get("/customer/me");
//   return res.data;
// };