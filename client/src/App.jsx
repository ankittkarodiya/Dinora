import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

import { setNavigate } from "./utils/navigation";

// new
import { isAdminPath } from "./utils/authStorage";



export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  // Only check for an admin session on genuinely admin-facing routes.
  // Everywhere else (landing page, login, register, menu, customer pages)
  // never runs this, regardless of what's sitting in localStorage.
  // const isAdminRoute = location.pathname.startsWith("/restaurant/");

  // useEffect(() => {
  //   if (!isAdminRoute) return;
  //   dispatch(loadUser());
  // }, [dispatch, isAdminRoute]);

  // new
  // Only check for an admin session on admin-facing pages ("/pizza-hub/...", "/setup").
  const adminSlug = isAdminPath(location.pathname) ? location.pathname.split("/")[1] : null;

  useEffect(() => {
    if (!adminSlug) return;
    dispatch(loadUser());
  }, [dispatch, adminSlug]);

  return (
    <AppRoutes />
  );
}
