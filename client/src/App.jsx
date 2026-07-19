import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <AppRoutes />
  );
}