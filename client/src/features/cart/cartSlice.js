import { createSlice } from "@reduxjs/toolkit";

// Persist cart to sessionStorage so a page refresh doesn't lose items
const CART_KEY = "dinora_cart";
const loadCart = () => {
  try {
    const saved = sessionStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};
const saveCart = (state) => {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify({
      items: state.items,
      tableId: state.tableId,
      tableName: state.tableName,
    }));
  } catch {}
};

const persisted = loadCart();

const cartSlice = createSlice({
  name: "cart",
  initialState: persisted || {
    items: [],
    tableId: null,
    tableName: null,
  },
  reducers: {
    setTable: (state, action) => {
      state.tableId = action.payload.tableId;
      state.tableName = action.payload.tableName;
      saveCart(state);
    },
    addToCart: (state, action) => {
      const itemId = action.payload._id || action.payload.id;
      const qty = action.payload.qty || 1;
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
      saveCart(state);
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
      saveCart(state);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.cartId !== action.payload);
      saveCart(state);
    },
    clearCart: (state) => {
      state.items = [];
      saveCart(state);
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

export const selectItemTotalCartQty = (itemId) => (state) =>
  state.cart.items
    .filter((i) => (i._id || i.id) === itemId)
    .reduce((sum, i) => sum + i.qty, 0);

export default cartSlice.reducer;
