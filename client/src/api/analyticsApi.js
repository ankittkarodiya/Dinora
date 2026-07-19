import axiosInstance from "./axiosInstance";

export const getAnalyticsApi = async (period = 7, from = null, to = null) => {
  let url = `/analytics?period=${period}`;
  if (from && to) url += `&from=${from}&to=${to}`;
  const res = await axiosInstance.get(url);
  return res.data;
};










// import axiosInstance from "./axiosInstance";

// export const getAnalyticsApi = async (period = 7) => {
//   const res = await axiosInstance.get(`/analytics?period=${period}`);
//   return res.data;
// };