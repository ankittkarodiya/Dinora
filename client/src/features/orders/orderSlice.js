import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
  },
  reducers: {
    placeOrder: (state, action) => {
      state.orders.push({
        ...action.payload,
        id: `ord-${Date.now()}`,
        status: "Pending",
        placedAt: new Date().toISOString(),
      });
    },
    // Admin will use this to update status
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (order) order.status = status;
    },
  },
});

export const { placeOrder, updateOrderStatus } = orderSlice.actions;

// Selectors
export const selectAllOrders = (state) => state.orders.orders;
export const selectOrdersByTable = (tableId) => (state) =>
  state.orders.orders.filter((o) => o.tableId === tableId);

export default orderSlice.reducer;