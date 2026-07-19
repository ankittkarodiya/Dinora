import axiosInstance from "./axiosInstance";

// admin — get all reviews for their restaurant
export const getReviewsApi = async () => {
  const res = await axiosInstance.get("/reviews");
  return res.data;
};









// import axiosInstance from "./axiosInstance";

// export const getReviewsApi = async () => {
//   const res = await axiosInstance.get("/reviews");
//   return res.data;
// };