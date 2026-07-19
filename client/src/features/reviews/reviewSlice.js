import { createSlice } from "@reduxjs/toolkit";

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
  },
  reducers: {
    addReview: (state, action) => {
      state.reviews.push({
        ...action.payload,
        id: `rev-${Date.now()}`,
        createdAt: new Date().toLocaleDateString("en-IN"),
      });
    },
    updateReview: (state, action) => {
      const i = state.reviews.findIndex((r) => r.id === action.payload.id);
      if (i !== -1) state.reviews[i] = { ...state.reviews[i], ...action.payload };
    },
  },
});

export const { addReview, updateReview } = reviewSlice.actions;

// Selectors
export const selectReviewsByItem = (itemId) => (state) =>
  state.reviews.reviews.filter((r) => r.itemId === itemId);

export const selectAvgRating = (itemId) => (state) => {
  const reviews = state.reviews.reviews.filter((r) => r.itemId === itemId);
  if (!reviews.length) return null;
  return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
};

export const selectUserReview = (itemId, userId) => (state) =>
  state.reviews.reviews.find((r) => r.itemId === itemId && r.userId === userId);

export default reviewSlice.reducer;