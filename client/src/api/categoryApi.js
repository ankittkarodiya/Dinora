import axiosInstance from "./axiosInstance";

export const getCategoriesApi = async () => {
  const res = await axiosInstance.get("/categories");
  return res.data;
};

export const createCategoryApi = async (data) => {
  const res = await axiosInstance.post("/categories", data);
  return res.data;
};

export const updateCategoryApi = async (id, data) => {
  const res = await axiosInstance.put(`/categories/${id}`, data);
  return res.data;
};

export const deleteCategoryApi = async (id) => {
  const res = await axiosInstance.delete(`/categories/${id}`);
  return res.data;
};

























// import axiosInstance from "./axiosInstance";

// export const getCategoriesApi = async () => {
//   const res = await axiosInstance.get("/categories");
//   return res.data;
// };

// export const createCategoryApi = async (data) => {
//   const res = await axiosInstance.post("/categories", data);
//   return res.data;
// };

// export const updateCategoryApi = async (id, data) => {
//   const res = await axiosInstance.put(`/categories/${id}`, data);
//   return res.data;
// };

// export const deleteCategoryApi = async (id) => {
//   const res = await axiosInstance.delete(`/categories/${id}`);
//   return res.data;
// };