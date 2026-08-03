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
  ChartColumnIncreasing,
  Settings,
  Star,
  LayoutDashboard,
  TabletSmartphone,
} from "lucide-react";

const navItems = [
  {
    to: "/restaurant/dashboard",
    icon: <LayoutDashboard className="w-5 h-5 text-white" />,
    label: "Dashboard",
  },
  {
    to: "/restaurant/categories",
    // icon: <Folders className="w-5 h-5 text-blue-400" />,
    icon: <Folders className="w-5 h-5 text-white" />,
    label: "Categories",
  },
  {
    to: "/restaurant/menu",
    // icon: <UtensilsCrossed className="w-6 h-6 text-pink-400" />,
    icon: <UtensilsCrossed className="w-6 h-6 text-white" />,
    label: "Menu Items",
  },
  {
    to: "/restaurant/tables",
    // icon: <QrCode className="w-5 h-5 text-violet-400" />,
    icon: <QrCode className="w-5 h-5 text-white" />,
    label: "Tables & QR",
  },
  {
    to: "/restaurant/orders",
    // icon: <ClipboardList className="w-5 h-5 text-orange-400" />,
    icon: <ClipboardList className="w-5 h-5 text-white" />,
    label: "Orders",
  },
  {
    to: "/restaurant/reviews",
    // icon: <Star className="w-5 h-5 text-yellow-400" />,
    icon: <Star className="w-5 h-5 text-white" />,
    label: "Reviews",
  },
  {
    to: "/restaurant/analytics",
    // icon: <ChartColumnIncreasing className="w-5 h-5 text-cyan-400" />,
    icon: <ChartColumnIncreasing className="w-5 h-5 text-white" />,
    label: "Analytics",
  },
  {
    to: "/restaurant/settings",
    icon: <Settings className="w-5 h-5 text-gray-400" />,
    label: "Settings",
  },
];

// ── Outer export — just wraps everything in the real-time orders
// provider, so it's available on every admin page, not just Orders ──
export default function RestaurantLayout({ children }) {
  return (
    <OrdersProvider>
      <LayoutContent>{children}</LayoutContent>
    </OrdersProvider>
  );
}

// ── Actual layout content — lives INSIDE the provider, so it can read
// live order data via useOrders() for the sidebar's pending badge ──
function LayoutContent({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // ← new

  const [restaurant, setRestaurant] = useState(null); // this local fetch still handles the preview-table-link logic below
  const [previewTableId, setPreviewTableId] = useState(null);

  // ← real pending count, from the same live data the Orders page uses —
  // replaces the old, disconnected Redux slice that never had real data
  const { orders } = useOrders();
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const [restaurantData, tablesData] = await Promise.all([
          getMyRestaurantApi(),
          getTablesApi(),
        ]);
        setRestaurant(restaurantData.restaurant);
        if (tablesData.tables?.length > 0) {
          setPreviewTableId(tablesData.tables[0]._id);
        } else {
          setPreviewTableId(null); // also handle the reverse case (last table deleted)
        }
      } catch (err) {
        console.error(err);
        // if fetching the restaurant fails (deleted, or genuinely invalid
        // session), force a clean logout rather than leaving them stuck
        if (err.response?.status === 404 || err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    };
    fetchRestaurant();
  }, [location.pathname]);

  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");
  //   navigate("/login");
  // };
  const handleLogout = async () => {
  try {
    await logoutApi(); // ← actually tells the backend to flip isLoggedIn to false
  } catch {
    // even if this fails (expired token, network issue), we still want to
    // clear local state and log the user out on this device regardless
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        bg-slate-900/90 backdrop-blur-xl border-r border-white/10
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">Dinora</h1>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {restaurant?.name || "Restaurant Admin"}
          </p>
          {user && (
            <p className="text-blue-400 text-xs mt-0.5 font-semibold">
              {user.username || user.name || user.email}
            </p>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "Orders" && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {restaurant && previewTableId ? (
            <a
              href={`/menu/${restaurant.slug}/${previewTableId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <TabletSmartphone className="w-5 h-5 text-sky-600" />
              <span>Preview Customer View</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed">
              <TabletSmartphone className="w-5 h-5 text-sky-600" />
              <span>Preview (Setup first)</span>
            </div>
          )}
          <button
            // onClick={handleLogout}
            // new
            onClick={() => setShowLogoutConfirm(true)}

            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
          >
            <span>[←</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-xl p-1"
          >
            ☰
          </button>
          <h1 className="text-white font-bold text-lg">Dinora</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {pendingCount} new
            </span>
          )}
        </div>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>


          {showLogoutConfirm && (
  <div
    onClick={() => setShowLogoutConfirm(false)}
    className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6"
    >
      <div className="text-center mb-5">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-white font-bold text-lg">Log Out?</h3>
        <p className="text-slate-400 text-xs mt-1">
          Are you sure you want to log out of your account?
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm"
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


























// import { useState, useEffect } from "react";
// // import { NavLink, useNavigate } from "react-router-dom";
// import { NavLink, useNavigate, useLocation } from "react-router-dom"; // ← add useLocation
// import { useSelector } from "react-redux";
// import { getMyRestaurantApi } from "../api/restaurantApi";
// import { getTablesApi } from "../api/tableApi";
// import {
//   HandCoins,
//   Coins,
//   TrendingUp,
//   Hourglass,
//   UtensilsCrossed,
//   Folders,
//   Table2,
//   QrCode,
//   ClipboardList,
//   MessageSquareMore,
//   ChartColumnIncreasing,
//   Settings,
//   Star,
//   LayoutDashboard,
//   MonitorSmartphone,
//   ExternalLink,
//   Eye,
//   TabletSmartphone,
// } from "lucide-react";
// // const navItems = [
// //   { to: "/restaurant/dashboard", icon: "𓃑", label: "Dashboard" },
// //   { to: "/restaurant/categories", icon: "📁", label: "Categories" },
// //   { to: "/restaurant/menu", icon: "🍽️", label: "Menu Items" },
// //   { to: "/restaurant/tables", icon: "🪑", label: "Tables & QR" },
// //   { to: "/restaurant/orders", icon: "📋", label: "Orders" },
// //   { to: "/restaurant/reviews", icon: "⭐", label: "Reviews" },
// //   { to: "/restaurant/analytics", icon: "📈", label: "Analytics" },
// //   { to: "/restaurant/settings", icon: "⚙️", label: "Settings" },
// // ];
// const navItems = [
//   // { to: "/restaurant/dashboard", icon: "𓃑", label: "Dashboard" },
//   {
//     to: "/restaurant/dashboard",
//     icon: <LayoutDashboard className="w-5 h-5 text-white" />,
//     label: "Dashboard",
//   },
//   {
//     to: "/restaurant/categories",
//     icon: <Folders className="w-5 h-5 text-blue-400" />,
//     label: "Categories",
//   },
//   {
//     to: "/restaurant/menu",
//     icon: <UtensilsCrossed className="w-6 h-6 text-pink-400" />,
//     label: "Menu Items",
//   },
//   {
//     to: "/restaurant/tables",
//     icon: <QrCode className="w-5 h-5 text-violet-400" />,
//     label: "Tables & QR",
//   },
//   {
//     to: "/restaurant/orders",
//     icon: <ClipboardList className="w-5 h-5 text-orange-400" />,
//     label: "Orders",
//   },
//   {
//     to: "/restaurant/reviews",
//     icon: <Star className="w-5 h-5 text-yellow-400" />,
//     label: "Reviews",
//   },
//   {
//     to: "/restaurant/analytics",
//     icon: <ChartColumnIncreasing className="w-5 h-5 text-cyan-400" />,
//     label: "Analytics",
//   },
//   {
//     to: "/restaurant/settings",
//     icon: <Settings className="w-5 h-5 text-gray-400" />,
//     label: "Settings",
//   },
// ];
// // Nav icons above are plain UI glyphs, not content photos — left as-is.
// export default function RestaurantLayout({ children }) {
//   const navigate = useNavigate();
//   const location = useLocation(); // ← add this alongside your existing useNavigate()

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [restaurant, setRestaurant] = useState(null);
//   const [previewTableId, setPreviewTableId] = useState(null);
//   // ❌ OLD — unused, kept only for reference. previewUrl never had a
//   // tableId at the end so the link was never actually clickable.
//   // const previewUrl = restaurant ? `/menu/${restaurant.slug}/` : null;
//   const orders = useSelector((s) => s.orders.orders);
//   const pendingCount = orders.filter((o) => o.status === "Pending").length;
//   const user = JSON.parse(localStorage.getItem("user") || "null");

//   useEffect(() => {
//     const fetchRestaurant = async () => {
//       try {
//         const [restaurantData, tablesData] = await Promise.all([
//           getMyRestaurantApi(),
//           getTablesApi(),
//         ]);
//         setRestaurant(restaurantData.restaurant);
//         if (tablesData.tables?.length > 0) {
//           setPreviewTableId(tablesData.tables[0]._id);
//         } else {
//         setPreviewTableId(null); // ← also handle the reverse case (last table deleted)
//         }

//       } catch (err) {
//         console.error(err);
//         // ← THE FIX: if fetching the restaurant fails (deleted, or genuinely
//         // invalid session), the account this token belongs to can't function
//         // in this layout anymore — force a clean logout rather than silently
//         // leaving them stuck on a broken dashboard forever.
//         if (err.response?.status === 404 || err.response?.status === 401) {
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//           navigate("/login");
//         }
//       }
//     };
//     fetchRestaurant();
//   }, [location.pathname]);


//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     navigate("/login");
//   };
//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 flex">
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/60 z-40 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//       <aside
//         className={`
//         fixed top-0 left-0 h-full w-64 z-50 flex flex-col
//         bg-slate-900/90 backdrop-blur-xl border-r border-white/10
//         transition-transform duration-300
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//         lg:translate-x-0 lg:static lg:z-auto
//       `}
//       >
//         {/* Header — "Dinora" text stays exactly as before */}
//         <div className="px-6 py-5 border-b border-white/10">
//           {/* ✅ NEW — restaurant logo sits beside the wordmark */}
//           <div className="flex items-center gap-3 mb-1">
//             <h1 className="text-2xl font-bold text-white">Dinora</h1>
//           </div>
//           {/* ✅ NEW — shows the actual restaurant name once it loads */}
//           <p className="text-slate-400 text-xs mt-1">
//             {restaurant?.name || "Restaurant Admin"}
//           </p>
//           {user && (
//             <p className="text-blue-400 text-xs mt-0.5 font-semibold">
//               {user.username || user.name || user.email}
//             </p>
//           )}
//         </div>
//         <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//           {navItems.map((item) => (
//             <NavLink
//               key={item.to}
//               to={item.to}
//               onClick={() => setSidebarOpen(false)}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
//                 ${
//                   isActive
//                     ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
//                     : "text-slate-300 hover:bg-white/10 hover:text-white"
//                 }`
//               }
//             >
//               <span className="text-base">{item.icon}</span>
//               <span>{item.label}</span>
//               {item.label === "Orders" && pendingCount > 0 && (
//                 <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
//                   {pendingCount}
//                 </span>
//               )}
//             </NavLink>
//           ))}
//         </nav>
//         <div className="px-3 py-4 border-t border-white/10 space-y-1">
//           {/* OLD — dead link, kept only for reference:
//           <a href={previewUrl} target="_blank" rel="noreferrer" ...>
//             <span>📱</span><span>Preview Customer View</span>
//           </a>
//           */}
//           {restaurant && previewTableId ? (
//             <a
//               href={`/menu/${restaurant.slug}/${previewTableId}`}
//               target="_blank"
//               rel="noreferrer"
//               className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
//             >
//               {/* <span>📱</span> */}
//               <TabletSmartphone className="w-5 h-5 text-sky-600" />
//               <span>Preview Customer View</span>
//             </a>
//           ) : (
//             <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed">
//               {/* <span>📱</span> */}
//               <TabletSmartphone className="w-5 h-5 text-sky-600" />
//               <span>Preview (Setup first)</span>
//             </div>
//           )}
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
//           >
//             <span>[←</span>
//             <span>Logout</span>
//           </button>
//         </div>
//       </aside>
//       {/* ✅ min-w-0 added — without this, the flex child refuses to shrink
//           below its content's natural width, which was forcing every page
//           rendered inside <main> to stay wider than the phone screen and
//           creating the white-space/horizontal-scroll bug on mobile */}
//       <div className="flex-1 flex flex-col min-h-screen min-w-0">
//         <div className="lg:hidden sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="text-white text-xl p-1"
//           >
//             ☰
//           </button>
//           <h1 className="text-white font-bold text-lg">Dinora</h1>
//           {pendingCount > 0 && (
//             <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
//               {pendingCount} new
//             </span>
//           )}
//         </div>
//         {/* ✅ min-w-0 added here too — same reasoning as above */}
//         <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-w-0">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }
