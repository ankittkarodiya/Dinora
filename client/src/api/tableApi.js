import axiosInstance from "./axiosInstance";

export const getTablesApi = async () => {
  const res = await axiosInstance.get("/tables");
  return res.data;
};

export const createTableApi = async (data) => {
  const res = await axiosInstance.post("/tables", data);
  return res.data;
};

export const deleteTableApi = async (id) => {
  const res = await axiosInstance.delete(`/tables/${id}`);
  return res.data;
};