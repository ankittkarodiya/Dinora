import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

import { setNavigate } from "./utils/navigation"; // ← new


export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  const navigate = useNavigate(); // ← new

  useEffect(() => {
    setNavigate(navigate); // ← new: registers it once, so axiosInstance can use it later
  }, [navigate]);



  // ← THE FIX: only check for an admin session on genuinely admin-facing
  // routes. Rather than excluding customer/public routes one at a time
  // (which is exactly how the landing page slipped through last time),
  // this only ALLOWS the check on the one place it's actually needed —
  // everywhere else (landing page, login, register, menu, customer pages)
  // never runs this, regardless of what's sitting in localStorage.
  const isAdminRoute = location.pathname.startsWith("/restaurant/");

  useEffect(() => {
    if (!isAdminRoute) return;
    dispatch(loadUser());
  }, [dispatch, isAdminRoute]);

  return (
    <AppRoutes />
  );
}

























// import { useEffect } from "react";
// import { useDispatch } from "react-redux";
// import { useLocation } from "react-router-dom";
// import { loadUser } from "./features/auth/authSlice";
// import AppRoutes from "./routes/AppRoutes";

// export default function App() {
//   const dispatch = useDispatch();
//   const location = useLocation();

//   // ← THE FIX: only check for an admin session on routes that are actually
//   // admin-facing. Without this, a customer scanning a table QR — who may
//   // have a stale, invalidated admin token sitting in this browser's
//   // localStorage from a previous session — triggers a real 401 /
//   // SESSION_INVALIDATED response and gets bounced to /login, completely
//   // unrelated to their actual visit as a customer.
//   const isCustomerFacingRoute =
//     location.pathname.startsWith("/menu/") ||
//     location.pathname.startsWith("/customer/");

//   useEffect(() => {
//     if (isCustomerFacingRoute) return;
//     dispatch(loadUser());
//   }, [dispatch, isCustomerFacingRoute]);

//   return (
//     <AppRoutes />
//   );
// }

























// import { useEffect } from "react";
// import { useDispatch } from "react-redux";
// import { loadUser } from "./features/auth/authSlice";
// import AppRoutes from "./routes/AppRoutes";

// export default function App() {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     dispatch(loadUser());
//   }, [dispatch]);

//   return (
//     <AppRoutes />
//   );
// }