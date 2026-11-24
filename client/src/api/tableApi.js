// after kiosk
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

// export const setTableKioskApi = async (id, isKiosk) => {
//   const res = await axiosInstance.patch(`/tables/${id}/kiosk`, { isKiosk });
//   return res.data;
// };

// new
export const generateKioskApi = async () => {
  const res = await axiosInstance.post("/tables/kiosk");
  return res.data;
};


















// before kiosk
// import axiosInstance from "./axiosInstance";

// export const getTablesApi = async () => {
//   const res = await axiosInstance.get("/tables");
//   return res.data;
// };

// export const createTableApi = async (data) => {
//   const res = await axiosInstance.post("/tables", data);
//   return res.data;
// };

// export const deleteTableApi = async (id) => {
//   const res = await axiosInstance.delete(`/tables/${id}`);
//   return res.data;
// };