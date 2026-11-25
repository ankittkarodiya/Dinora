import { Navigate, useSearchParams } from "react-router-dom";
import { findStartSlug } from "../utils/authStorage";

// The installed app opens here. It sends you to the restaurant you used last
// (if you're still signed in), otherwise to the login page.
export default function AppEntry() {
  const [params] = useSearchParams();
  const slug = findStartSlug();
  const to = params.get("to") || "dashboard";
  const page = /^[a-z-]+$/.test(to) ? to : "dashboard";
  return slug ? <Navigate to={`/${slug}/${page}`} replace /> : <Navigate to="/login" replace />;
}