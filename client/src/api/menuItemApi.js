import axiosInstance from "./axiosInstance";

export const getMenuItemsApi = async () => {
  const res = await axiosInstance.get("/menuitems");
  return res.data;
};

// payload is a plain object now — image (if present) is already a
// Cloudinary URL string, uploaded directly from the browser beforehand.
// No FormData, no multipart headers — let axiosInstance's default
// JSON content-type apply automatically.
export const createMenuItemApi = async (payload) => {
  const res = await axiosInstance.post("/menuitems", payload);
  return res.data;
};

export const updateMenuItemApi = async (id, payload) => {
  const res = await axiosInstance.put(`/menuitems/${id}`, payload);
  return res.data;
};

export const deleteMenuItemApi = async (id) => {
  const res = await axiosInstance.delete(`/menuitems/${id}`);
  return res.data;
};

export const toggleAvailabilityApi = async (id) => {
  const res = await axiosInstance.patch(`/menuitems/${id}/toggle`);
  return res.data;
};

























// import axiosInstance from "./axiosInstance";

// export const getMenuItemsApi = async () => {
//   const res = await axiosInstance.get("/menuitems");
//   return res.data;
// };

// // formData must be built with new FormData() including an "image" file field
// export const createMenuItemApi = async (formData) => {
//   const res = await axiosInstance.post("/menuitems", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// export const updateMenuItemApi = async (id, formData) => {
//   const res = await axiosInstance.put(`/menuitems/${id}`, formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// export const deleteMenuItemApi = async (id) => {
//   const res = await axiosInstance.delete(`/menuitems/${id}`);
//   return res.data;
// };

// export const toggleAvailabilityApi = async (id) => {
//   const res = await axiosInstance.patch(`/menuitems/${id}/toggle`);
//   return res.data;
// };









// import axiosInstance from "./axiosInstance";

// export const getMenuItemsApi = async () => {
//   const res = await axiosInstance.get("/menuitems");
//   return res.data;
// };

// export const createMenuItemApi = async (data) => {
//   const res = await axiosInstance.post("/menuitems", data);
//   return res.data;
// };

// export const updateMenuItemApi = async (id, data) => {
//   const res = await axiosInstance.put(`/menuitems/${id}`, data);
//   return res.data;
// };

// export const deleteMenuItemApi = async (id) => {
//   const res = await axiosInstance.delete(`/menuitems/${id}`);
//   return res.data;
// };

// export const toggleAvailabilityApi = async (id) => {
//   const res = await axiosInstance.patch(`/menuitems/${id}/toggle`);
//   return res.data;
// };