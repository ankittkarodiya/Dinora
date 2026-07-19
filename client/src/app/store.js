import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import menuReducer from "../features/menu/menuSlice";
import cartReducer from "../features/cart/cartSlice";
import orderReducer from "../features/orders/orderSlice";
import reviewReducer from "../features/reviews/reviewSlice";
import customerAuthReducer from "../features/customerAuth/customerAuthSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,              // admin auth (already built)
    menu: menuReducer,              // categories, items, tables
    cart: cartReducer,              // customer cart
    orders: orderReducer,           // all orders — admin reads this
    reviews: reviewReducer,         // all reviews
    customerAuth: customerAuthReducer, // customer accounts for reviews
  },
});