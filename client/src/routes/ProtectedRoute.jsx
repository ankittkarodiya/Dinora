import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    if (user.role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
    if (user.role === "restaurant_admin") return <Navigate to="/restaurant/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

















// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children, role }) {
//   const { isAuthenticated, user, initializing } = useSelector((s) => s.auth);

//   if (initializing) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#64748B" }}>
//         Loading...
//       </div>
//     );
//   }

//   if (!isAuthenticated) return <Navigate to="/login" replace />;

//   if (role && user?.role !== role) {
//     if (user.role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
//     if (user.role === "restaurant_admin") return <Navigate to="/restaurant/dashboard" replace />;
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// }




















// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children, role }) {
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user") || "null");

//   if (!token || !user) return <Navigate to="/login" replace />;

//   if (role && user.role !== role) {
//     if (user.role === "superadmin") return <Navigate to="/superadmin/dashboard" replace />;
//     if (user.role === "restaurant_admin") return <Navigate to="/restaurant/dashboard" replace />;
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// }