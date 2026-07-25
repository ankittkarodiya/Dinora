import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  // ← THE FIX: only check for an admin session on routes that are actually
  // admin-facing. Without this, a customer scanning a table QR — who may
  // have a stale, invalidated admin token sitting in this browser's
  // localStorage from a previous session — triggers a real 401 /
  // SESSION_INVALIDATED response and gets bounced to /login, completely
  // unrelated to their actual visit as a customer.
  const isCustomerFacingRoute =
    location.pathname.startsWith("/menu/") ||
    location.pathname.startsWith("/customer/");

  useEffect(() => {
    if (isCustomerFacingRoute) return;
    dispatch(loadUser());
  }, [dispatch, isCustomerFacingRoute]);

  return (
    <AppRoutes />
  );
}

























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