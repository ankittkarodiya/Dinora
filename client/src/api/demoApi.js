import axiosInstance from "./axiosInstance";

export const createDemoRequestApi = async (data) => {
  const res = await axiosInstance.post("/demo-requests", data);
  return res.data;
};