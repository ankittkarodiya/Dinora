// after kiosk

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import { logoutApi } from "../api/authApi";
import { getMyRestaurantApi } from "../api/restaurantApi";
import { getTablesApi } from "../api/tableApi";
import { OrdersProvider, useOrders } from "../context/OrdersContext";
import {
  UtensilsCrossed,
  Folders,
  QrCode,
  ClipboardList,
  Store,
  ChartColumnIncreasing,
  Settings,
  Star,
  LayoutDashboard,
  TabletSmartphone,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";

import toast from "react-hot-toast";

// new
import { adminPath, getUser, clearSession } from "../utils/authStorage";
import { disconnectSocket } from "../utils/socket";




// const navItems = [
//   { to: "/restaurant/dashboard",  icon: LayoutDashboard,       label: "Dashboard" },
//   { to: "/restaurant/categories", icon: Folders,               label: "Categories" },
//   { to: "/restaurant/menu",       icon: UtensilsCrossed,       label: "Menu Items" },
//   { to: "/restaurant/tables",     icon: QrCode,                label: "Tables & QR" },
//   { to: "/restaurant/orders",     icon: ClipboardList,         label: "Orders" },
//   { to: "/restaurant/reviews",    icon: Star,                  label: "Reviews" },
//   { to: "/restaurant/analytics",  icon: ChartColumnIncreasing, label: "Analytics" },
//   { to: "/restaurant/settings",   icon: Settings,              label: "Settings" },
// ];

// new
const navItems = [
  { to: "dashboard",  icon: LayoutDashboard,       label: "Dashboard" },
  { to: "categories", icon: Folders,               label: "Categories" },
  { to: "menu",       icon: UtensilsCrossed,       label: "Menu Items" },
  { to: "tables",     icon: QrCode,                label: "Tables & QR" },
  { to: "orders",     icon: ClipboardList,         label: "Orders" },
  { to: "reviews",    icon: Star,                  label: "Reviews" },
  { to: "analytics",  icon: ChartColumnIncreasing, label: "Analytics" },
  { to: "settings",   icon: Settings,              label: "Settings" },
];

// ── Outer export — wraps in real-time orders provider ──
export default function RestaurantLayout({ children }) {
  return (
    <OrdersProvider>
      <LayoutContent>{children}</LayoutContent>
    </OrdersProvider>
  );
}

// ══════════════════════════════════════════════════════════════════
// LIGHT ADMIN THEME
// Palette: pure white (#fff) → soft grays (#f7f7f7, #f0f0f0,
// #e4e4e4, #d0d0d0) — NO dark sidebar, everything soft & clean
// Blue accent (#2563eb) for active nav + primary buttons
// ══════════════════════════════════════════════════════════════════
function LayoutContent({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // commenting them (both) out
  // const [restaurant, setRestaurant] = useState(null);
  // const [previewTableId, setPreviewTableId] = useState(null);

  const { orders } = useOrders();
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  // const user = JSON.parse(localStorage.getItem("user") || "null");
  // new
  const user = getUser();

  // new so other restro data cant be seen by any other restro
  const queryClient = useQueryClient();




  // useEffect(() => {
  //   const fetchRestaurant = async () => {
  //     try {
  //       const [restaurantData, tablesData] = await Promise.all([
  //         getMyRestaurantApi(),
  //         getTablesApi(),
  //       ]);
  //       setRestaurant(restaurantData.restaurant);
  //       if (tablesData.tables?.length > 0) {
  //         setPreviewTableId(tablesData.tables[0]._id);
  //       } else {
  //         setPreviewTableId(null);
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       if (err.response?.status === 404 || err.response?.status === 401) {
  //         localStorage.removeItem("token");
  //         localStorage.removeItem("user");
  //         navigate("/login");
  //       }
  //     }
  //   };
  //   fetchRestaurant();
  // }, [location.pathname]);
  
  // new
    // Shared cache keys with Dashboard/Tables/Settings — so navigating
  // between admin pages reuses the cached data instead of refetching.
  const { data: restaurant = null, error: restaurantError } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await getMyRestaurantApi()).restaurant,
    retry: false,
  });

  const { data: tablesList } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => (await getTablesApi()).tables || [],
  });

  const previewTableId = tablesList?.length > 0 ? tablesList[0]._id : null;

  // Same 404/401 -> back to login behaviour as before
  useEffect(() => {
    const status = restaurantError?.response?.status;
    if (status === 404 || status === 401) {

      // localStorage.removeItem("token");
      // localStorage.removeItem("user");
      // new
      clearSession();

      navigate("/login");
    }
  }, [restaurantError, navigate]);


  const handleLogout = async () => {
    try {
      await logoutApi();
      toast.success("Logged out successfully");
    } catch {
      // clear local state regardless
    }

    // localStorage.removeItem("token");
    // localStorage.removeItem("user");
    // new
    clearSession();

    // new
    queryClient.clear(); // forget this restaurant's cached data
    disconnectSocket(); // leave this restaurant's live-order room


    setTimeout(() => navigate("/login"), 300);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f5f5f5" }}>
      {/* mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR — light white/gray ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e4e4e4",
        }}
      >
        {/* brand header */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #e4e4e4" }}>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <span className="text-[#171717]">Din</span>
            <span className="text-[#E34F36]">ora</span>
          </h1>

          <p className="text-xs mt-1" style={{ color: "#888" }}>
            {restaurant?.name || "Restaurant Admin"}
          </p>
          {user && (
            <p className="text-xs mt-0.5 font-semibold" style={{ color: "#2563eb" }}>
              {user.username || user.name || user.email}
            </p>
          )}
        </div>

        {/* nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}

                // to={item.to}
                // new
                to={adminPath(item.to)}

                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "text-white font-semibold"
                      : "hover:bg-gray-100"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: "#2563eb", color: "#fff" }
                    : { color: "#555" }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4.5 h-4.5" style={{ color: isActive ? "#fff" : "#888" }} />
                    <span>{item.label}</span>
                    {item.label === "Orders" && pendingCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* bottom actions */}
        <div className="px-3 py-4 space-y-1" style={{ borderTop: "1px solid #e4e4e4" }}>

          {/* {restaurant && previewTableId ? (
            <a
              href={`/menu/${restaurant.slug}/${previewTableId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100"
              style={{ color: "#555" }}
            >
              <TabletSmartphone className="w-4.5 h-4.5" style={{ color: "#2563eb" }} />
              <span>Preview Customer View</span>
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#ccc" }} />
            </a>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed" style={{ color: "#bbb" }}>
              <TabletSmartphone className="w-4.5 h-4.5" style={{ color: "#ccc" }} />
              <span>Preview (Setup first)</span>
            </div>
          )} */}

          {/* new for counter orders */}
            <NavLink

            // to="/restaurant/counter"
            // new
            to={adminPath("counter")}

            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer hover:bg-gray-100 active:scale-[0.98]"
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: "#2563eb", color: "#fff" }
                : { color: "#555" }
            }
          >
            {({ isActive }) => (
              <>
                <Store
                  className="w-4.5 h-4.5"
                  style={{ color: isActive ? "#fff" : "#2563eb" }}
                />
                <span>Counter Order</span>
                <ChevronRight
                  className="w-4 h-4 ml-auto"
                  style={{ color: isActive ? "#fff" : "#ccc" }}
                />
              </>
            )}
          </NavLink>



          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-50"
            style={{ color: "#ef4444" }}
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT — light gray background ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        {/* mobile top bar — light theme */}
        <div
          className="lg:hidden sticky top-0 z-30 backdrop-blur-md px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", borderBottom: "1px solid #e4e4e4" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1"
            style={{ color: "#333" }}
          >
            <Menu size={22} />
          </button>

          {/* <h1 className="font-bold text-lg" style={{ color: "#1a1a1a" }}>Dinora</h1> */}
          <h1
            // className="font-bold text-lg"
            className="font-bold text-xl tracking-tight"
            style={{ 
              // color: "#1a1a1a",
              color: "#171717",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {restaurant?.name || "Dinora"}
          </h1>

          {pendingCount > 0 ? (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {pendingCount} new
            </span>
          ) : (
            <div className="w-8" /> /* spacer for centering */
          )}
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      {/* ── Logout Confirmation Modal — light theme ── */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 bg-black/40 z-100 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: "#fff", border: "1px solid #e4e4e4" }}
          >
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
                <LogOut className="w-6 h-6" style={{ color: "#2563eb" }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: "#1a1a1a" }}>Log Out?</h3>
              <p className="text-sm mt-1" style={{ color: "#888" }}>
                Are you sure you want to log out of your account?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                // className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"

                // new for clickable looking button
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:brightness-95 active:brightness-90 active:scale-[0.98] disabled:opacity-50"

                style={{ backgroundColor: "#f7f7f7", border: "1px solid #e4e4e4", color: "#555" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                // className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"

                // new for clickable looking button
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"

              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
