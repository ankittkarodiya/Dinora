import axiosInstance from "./axiosInstance";

export const getMyRestaurantApi = async () => {
  const res = await axiosInstance.get("/restaurant/me");
  return res.data;
};

export const createRestaurantApi = async (data) => {
  const res = await axiosInstance.post("/restaurant", data);
  return res.data;
};

export const updateRestaurantApi = async (data) => {
  const res = await axiosInstance.put("/restaurant", data);
  return res.data;
};

// NEW
export const uploadLogoApi = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await axiosInstance.post("/restaurant/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

























// import axiosInstance from "./axiosInstance";

// export const getMyRestaurantApi = async () => {
//   const res = await axiosInstance.get("/restaurant/me");
//   return res.data;
// };

// export const createRestaurantApi = async (data) => {
//   const res = await axiosInstance.post("/restaurant", data);
//   return res.data;
// };

// export const updateRestaurantApi = async (data) => {
//   const res = await axiosInstance.put("/restaurant", data);
//   return res.data;
// };