import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
// import CustomerDashboard from "../pages/customer/CustomerDashboard"
// import RestaurantAdminDashboard from "../pages/restaurant/RestroAdminDashboard";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Verification from "../pages/auth/Verification";
import RegisterVerify from "../pages/auth/RegisterVerify";
import ChangePassword from "../pages/auth/ChangePassword";
import Dashboard from "../pages/restaurant/Dashboard";

import CustomerMenuPage from "../pages/customer/MenuPage";
import PageNotFound from "../pages/404Error/PageNotFound";
import Categories from "../pages/restaurant/Categories";
import MenuManager from "../pages/restaurant/MenuManager";
import Tables from "../pages/restaurant/Tables";
import Orders from "../pages/restaurant/Orders";
import Reviews from "../pages/restaurant/Reviews";
import RestaurantLayout from "../layouts/RestaurantLayout";
import RestaurantSetup from "../pages/restaurant/RestaurantSetup";

import CustomerRegister from "../pages/customer/CustomerRegister";
import CustomerLogin from "../pages/customer/CustomerLogin";
import Analytics from "../pages/restaurant/Analytics";
import Settings from "../pages/restaurant/Settings";

import LandingPage from "../pages/LandingPage";

const SuperAdminDashboard = () => (
  <div style={{ color: "#fff", padding: 40 }}>
    Super Admin Dashboard — Week 2
  </div>
);
const RestaurantDashboard = () => (
  <div style={{ color: "#fff", padding: 40 }}>
    Restaurant Dashboard — Week 3
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/register-verification" element={<RegisterVerify />} />
      <Route path="/verification/:token" element={<Verification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email/:email" element={<VerifyEmail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password/:email" element={<ChangePassword />} />
      {/* <Route path="/customer" element={<CustomerDashboard />} /> */}
      <Route
        path="/menu/:restaurantSlug/:tableId"
        element={<CustomerMenuPage />}
      />
      {/* <Route path="/restaurant-admin" element={<RestaurantAdminDashboard />} /> */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      // add these routes — public, no ProtectedRoute needed
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute role="superadmin">
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
      {/* <Route path="/menu/:restaurantSlug/:tableId" element={<div>Customer Menu — Week 4</div>} /> */}
      <Route
        path="/restaurant/setup"
        element={
          <ProtectedRoute role="restaurant_admin">
            <RestaurantSetup />
          </ProtectedRoute>
        }
      />
      {/* Restaurant Admin — all wrapped in layout */}
      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute role="restaurant_admin">
            <RestaurantLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="menu" element={<MenuManager />} />
                <Route path="tables" element={<Tables />} />
                <Route path="orders" element={<Orders />} />
                <Route path="reviews" element={<Reviews />} />
                {/* new 👇*/}
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                {/* new 👆*/}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </RestaurantLayout>
          </ProtectedRoute>
        }
      />
      {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}

      {/* // FIND: */}
      {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
      {/* // REPLACE with: */}
      <Route path="/" element={<LandingPage />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
