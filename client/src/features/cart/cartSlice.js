import { createSlice } from "@reduxjs/toolkit";
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    tableId: null,
    tableName: null,
  },
  reducers: {
    setTable: (state, action) => {
      state.tableId = action.payload.tableId;
      state.tableName = action.payload.tableName;
    },
    addToCart: (state, action) => {
      const itemId = action.payload._id || action.payload.id;
      const qty = action.payload.qty || 1;
      // ← NEW: portion is null for ordinary items, "half" or "full" when a
      // customer picked one — the same dish can now exist as two separate
      // cart lines (Half AND Full), so identity has to include portion too
      const portion = action.payload.portion || null;
      const existing = state.items.find(
        (i) => (i._id || i.id) === itemId && (i.portion || null) === portion,
      );
      if (existing) {
        existing.qty += qty;
      } else {
        state.items.push({
          ...action.payload,
          _id: itemId,
          cartId: `${itemId}-${portion || "std"}-${Date.now()}`,
          portion,
          qty,
        });
      }
    },
    updateQty: (state, action) => {
      const { cartId, delta } = action.payload;
      const item = state.items.find((i) => i.cartId === cartId);
      if (!item) return;
      if (item.qty === 1 && delta === -1) {
        state.items = state.items.filter((i) => i.cartId !== cartId);
      } else {
        item.qty += delta;
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.cartId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});
export const { setTable, addToCart, updateQty, removeFromCart, clearCart } =
  cartSlice.actions;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
export const calculateGrandTotal = (subtotal, gstPercent = 5) => {
  const gstAmount = (subtotal * gstPercent) / 100;
  return { subtotal, gstAmount, grandTotal: subtotal + gstAmount };
};
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.qty, 0);
// ← NEW: both selectors now take an optional portion param, defaulting to
// null — every existing call site (ItemRow, for ordinary items) keeps
// working exactly as before, since portion is null on both sides there
export const selectItemCartQty =
  (itemId, portion = null) =>
  (state) =>
    state.cart.items
      .filter(
        (i) => (i._id || i.id) === itemId && (i.portion || null) === portion,
      )
      .reduce((sum, i) => sum + i.qty, 0);
export const selectItemCartId =
  (itemId, portion = null) =>
  (state) =>
    state.cart.items.find(
      (i) => (i._id || i.id) === itemId && (i.portion || null) === portion,
    )?.cartId || null;


// ← new: total quantity across ALL portions of this item combined —
// used to show a single count badge even when Half and Full are both in cart
export const selectItemTotalCartQty = (itemId) => (state) =>
  state.cart.items
    .filter((i) => (i._id || i.id) === itemId)
    .reduce((sum, i) => sum + i.qty, 0);

export default cartSlice.reducer;























// import { createSlice } from "@reduxjs/toolkit";

// const cartSlice = createSlice({
//   name: "cart",
//   initialState: {
//     items: [],
//     tableId: null,
//     tableName: null,
//   },
//   reducers: {
//     setTable: (state, action) => {
//       state.tableId = action.payload.tableId;
//       state.tableName = action.payload.tableName;
//     },
//     addToCart: (state, action) => {
//       const itemId = action.payload._id || action.payload.id;
//       const qty = action.payload.qty || 1;

//       const existing = state.items.find((i) => (i._id || i.id) === itemId);
//       if (existing) {
//         existing.qty += qty;
//       } else {
//         state.items.push({
//           ...action.payload,
//           _id: itemId,
//           cartId: `${itemId}-${Date.now()}`,
//           qty,
//         });
//       }
//     },
//     updateQty: (state, action) => {
//       const { cartId, delta } = action.payload;
//       const item = state.items.find((i) => i.cartId === cartId);
//       if (!item) return;
//       if (item.qty === 1 && delta === -1) {
//         state.items = state.items.filter((i) => i.cartId !== cartId);
//       } else {
//         item.qty += delta;
//       }
//     },
//     removeFromCart: (state, action) => {
//       state.items = state.items.filter((i) => i.cartId !== action.payload);
//     },
//     clearCart: (state) => {
//       state.items = [];
//     },
//   },
// });

// export const { setTable, addToCart, updateQty, removeFromCart, clearCart } = cartSlice.actions;

// export const selectCartItems = (state) => state.cart.items;

// // Base subtotal — items only, no tax. Intentionally NOT the final charged
// // amount. GST isn't cart state (it's restaurant-specific), so use the helper
// // below wherever the customer-facing final price needs to be shown.
// export const selectCartTotal = (state) =>
//   state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

// export const calculateGrandTotal = (subtotal, gstPercent = 5) => {
//   const gstAmount = (subtotal * gstPercent) / 100;
//   return { subtotal, gstAmount, grandTotal: subtotal + gstAmount };
// };

// export const selectCartCount = (state) =>
//   state.cart.items.reduce((sum, i) => sum + i.qty, 0);

// // fixed selectors — check both _id and id
// export const selectItemCartQty = (itemId) => (state) =>
//   state.cart.items.find((i) => (i._id || i.id) === itemId)?.qty || 0;

// export const selectItemCartId = (itemId) => (state) =>
//   state.cart.items.find((i) => (i._id || i.id) === itemId)?.cartId || null;

// export default cartSlice.reducer;

// import { createSlice } from "@reduxjs/toolkit";

// const cartSlice = createSlice({
//   name: "cart",
//   initialState: {
//     items: [],
//     tableId: null,
//     tableName: null,
//   },
//   reducers: {
//     setTable: (state, action) => {
//       state.tableId = action.payload.tableId;
//       state.tableName = action.payload.tableName;
//     },
//     addToCart: (state, action) => {
//     //   const itemId = action.payload._id || action.payload.id;
//     //   const qty = action.payload.qty || 1;

//       const { id, qty = 1 } = action.payload;
//       const existing = state.items.find((i) => i.id === id);
//       if (existing) {
//         existing.qty += qty;
//       } else {
//         state.items.push({ ...action.payload, cartId: `${id}-${Date.now()}`, qty });
//       }
//     },
//     updateQty: (state, action) => {
//       const { cartId, delta } = action.payload;
//       const item = state.items.find((i) => i.cartId === cartId);
//       if (!item) return;
//       if (item.qty === 1 && delta === -1) {
//         state.items = state.items.filter((i) => i.cartId !== cartId);
//       } else {
//         item.qty += delta;
//       }
//     },
//     removeFromCart: (state, action) => {
//       state.items = state.items.filter((i) => i.cartId !== action.payload);
//     },
//     clearCart: (state) => {
//       state.items = [];
//     },
//   },
// });

// export const { setTable, addToCart, updateQty, removeFromCart, clearCart } = cartSlice.actions;

// // Selectors
// export const selectCartItems = (state) => state.cart.items;
// export const selectCartTotal = (state) =>
//   state.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
// export const selectCartCount = (state) =>
//   state.cart.items.reduce((sum, i) => sum + i.qty, 0);
// export const selectItemCartQty = (itemId) => (state) =>
//   state.cart.items.find((i) => i._id === itemId || i._id === itemId)?.qty || 0;
// export const selectItemCartId = (itemId) => (state) =>
//   state.cart.items.find((i) => i._id === itemId || i._id === itemId)?.cartId || null;

// export default cartSlice.reducer;