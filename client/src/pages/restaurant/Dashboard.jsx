import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrdersApi } from "../../api/orderApi";
import { getMenuItemsApi } from "../../api/menuItemApi";
import { getCategoriesApi } from "../../api/categoryApi";
import { getTablesApi } from "../../api/tableApi";
import { getReviewsApi } from "../../api/reviewApi";
import { useSubscription } from "../../hooks/useSubscription";

import {
  HandCoins,
  Coins,
  TrendingUp, Hourglass, UtensilsCrossed, 
  Star} from "lucide-react";

const STATUS_STYLE = {
  Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Accepted: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Ready: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Served: "bg-green-500/20 text-green-300 border-green-500/30",
  Completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function StatCard({ icon, label, value, sub, color = "blue", locked = false }) {
  const colors = {
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20",
    green: "from-green-600/20 to-green-600/5 border-green-500/20",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20",
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
  };
  return (
    <div className={`rounded-2xl border bg-linear-to-br ${colors[color]} p-5`}>
      <div className="text-2xl mb-2">{icon}</div>
      {locked ? (
        <>
          <div className="text-slate-500 font-bold text-lg flex items-center gap-1.5">
            🔒 Pro
          </div>
          <div className="text-slate-500 text-sm mt-0.5">{label}</div>
        </>
      ) : (
        <>
          <div className="text-white font-bold text-2xl">{value}</div>
          <div className="text-slate-300 text-sm mt-0.5">{label}</div>
          {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { isPro, loading: subLoading } = useSubscription();

  // ← THE CHANGE: all five useState calls (orders, menuItems, categories,
  // tables, reviews, loading), the lastFetchKeyRef guard, its useEffect,
  // and the fetchAll function are all replaced by ONE useQuery call below.
  // React Query caches this under the key ["dashboard", isPro] — so
  // navigating away to another page and back within 30 seconds shows this
  // data INSTANTLY from cache, no loading spinner, exactly like Orders
  // already does via OrdersContext. Same Promise.allSettled behavior as
  // before is preserved inside queryFn — one failed call still never
  // blocks the other four from showing their data.
  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["dashboard", isPro],
    queryFn: async () => {
      const calls = [
        getOrdersApi(),
        getMenuItemsApi(),
        getCategoriesApi(),
        getTablesApi(),
        isPro ? getReviewsApi() : Promise.resolve({ reviews: [] }),
      ];
      const [o, m, c, t, r] = await Promise.allSettled(calls);
      return {
        orders: o.status === "fulfilled" ? o.value.orders || [] : [],
        menuItems: m.status === "fulfilled" ? m.value.items || [] : [],
        categories: c.status === "fulfilled" ? c.value.categories || [] : [],
        tables: t.status === "fulfilled" ? t.value.tables || [] : [],
        reviews: r.status === "fulfilled" ? r.value.reviews || [] : [],
      };
    },
    enabled: !subLoading, // same guard as before — wait for subscription info first
  });

  const orders = data?.orders || [];
  const menuItems = data?.menuItems || [];
  const categories = data?.categories || [];
  const tables = data?.tables || [];
  const reviews = data?.reviews || [];
  const loading = queryLoading;

  // const totalRevenue = orders
  //   .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
  //   .reduce((s, o) => s + o.totalAmount, 0);

  // helper — check if a date falls within today
  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // replace your existing totalRevenue calculation with this
  const todaysRevenue = orders
    .filter(
      (o) =>
        o.status === "Completed" &&
        o.paymentStatus === "paid" &&
        isToday(o.createdAt),
    )
    .reduce((s, o) => s + o.totalAmount, 0);

  const todaysOrderCount = orders.filter((o) => isToday(o.createdAt)).length;

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const preparingOrders = orders.filter((o) => o.status === "Preparing").length;

  // const completedOrders = orders.filter((o) => o.status === "Completed").length;
  const todaysCompletedOrders = orders.filter(
  (o) => o.status === "Completed" && isToday(o.createdAt)
  ).length;

  const recentOrders = [...orders].slice(0, 5);

  if (subLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-slate-400 text-sm animate-pulse">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back — here's what's happening today
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          // icon="💰"
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          // icon={<HandCoins className="w-6 h-6 text-emerald-400" />}
          label="Today's Revenue"
          value={`₹${todaysRevenue.toLocaleString()}`}
          sub={`from ${todaysOrderCount} orders today`}
          color="green"
        />

        {/* <StatCard icon="💰" label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub={`from ${orders.length} orders`} color="green" /> */}

        <StatCard
          // icon="📋"
          icon={<Hourglass className="w-6 h-6 text-amber-400" />}
          label="Pending Orders"
          value={pendingOrders}
          sub={`${preparingOrders} preparing`}
          color="amber"
        />
        <StatCard
          // icon="🍽️"
          icon={<UtensilsCrossed className="w-6 h-6 text-pink-400" />}
          label="Menu Items"
          value={menuItems.length}
          sub={`${categories.length} categories`}
          color="blue"
        />
        <StatCard
          // icon="⭐"
          icon = {<Star className="w-5 h-5 text-yellow-400" />}
          label="Reviews"
          value={reviews.length}
          sub={`${tables.length} tables active`}
          color="purple"
          locked={!isPro}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <h3 className="text-white font-bold text-base mb-5">
          Order Status Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Pending",
              count: pendingOrders,
              color: "text-amber-400",
              bg: "bg-amber-400/10",
              border: "border-amber-400/20",
            },
            {
              label: "Preparing",
              count: preparingOrders,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
              border: "border-blue-400/20",
            },
            {
              label: "Ready",
              count: orders.filter((o) => o.status === "Ready").length,
              color: "text-purple-400",
              bg: "bg-purple-400/10",
              border: "border-purple-400/20",
            },
            {
              label: "Completed",
              // count: completedOrders,
              count: todaysCompletedOrders,
              color: "text-green-400",
              bg: "bg-green-400/10",
              border: "border-green-400/20",
              sub: true //new
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}
            >
              <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-slate-400 text-xs font-medium mt-1">
                {s.label}
                {s.sub && <span className="block text-slate-500 text-[10px] font-normal mt-0.5">Today's completed orders</span>}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"> */}
      <div className="space-y-4">
        {/* <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"> */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base">Recent Orders</h3>
            <Link
              to="/restaurant/orders"
              className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-sm">No orders yet</div>
              <div className="text-xs mt-1">
                Share your QR codes so customers can order
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">
                      {order.tableId?.name || "Unknown Table"} ·{" "}
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 truncate">
                      {order.items.map((i) => i.name).join(", ")}
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-white font-bold text-sm mb-1">
                      ₹{order.totalAmount}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] || ""}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


























// import { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import { getOrdersApi } from "../../api/orderApi";
// import { getMenuItemsApi } from "../../api/menuItemApi";
// import { getCategoriesApi } from "../../api/categoryApi";
// import { getTablesApi } from "../../api/tableApi";
// import { getReviewsApi } from "../../api/reviewApi";
// import { useSubscription } from "../../hooks/useSubscription";

// import {
//   HandCoins,
//   Coins,
//   TrendingUp, Hourglass, UtensilsCrossed, 
//   Star} from "lucide-react";

// const STATUS_STYLE = {
//   Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
//   Accepted: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
//   Preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
//   Ready: "bg-purple-500/20 text-purple-300 border-purple-500/30",
//   Served: "bg-green-500/20 text-green-300 border-green-500/30",
//   Completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
//   Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
// };

// function StatCard({ icon, label, value, sub, color = "blue", locked = false }) {
//   const colors = {
//     blue: "from-blue-600/20 to-blue-600/5 border-blue-500/20",
//     green: "from-green-600/20 to-green-600/5 border-green-500/20",
//     amber: "from-amber-600/20 to-amber-600/5 border-amber-500/20",
//     purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
//   };
//   return (
//     <div className={`rounded-2xl border bg-linear-to-br ${colors[color]} p-5`}>
//       <div className="text-2xl mb-2">{icon}</div>
//       {locked ? (
//         <>
//           <div className="text-slate-500 font-bold text-lg flex items-center gap-1.5">
//             🔒 Pro
//           </div>
//           <div className="text-slate-500 text-sm mt-0.5">{label}</div>
//         </>
//       ) : (
//         <>
//           <div className="text-white font-bold text-2xl">{value}</div>
//           <div className="text-slate-300 text-sm mt-0.5">{label}</div>
//           {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//         </>
//       )}
//     </div>
//   );
// }

// export default function Dashboard() {
//   const { isPro, loading: subLoading } = useSubscription();
//   const [orders, setOrders] = useState([]);
//   const [menuItems, setMenuItems] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [tables, setTables] = useState([]);
//   const [reviews, setReviews] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // useEffect(() => {
//   //   if (subLoading) return;
//   //   fetchAll();
//   // }, [subLoading, isPro]);

//   const lastFetchKeyRef = useRef(null);

//   useEffect(() => {
//     if (subLoading) return;

//     const currentKey = `${subLoading}-${isPro}`;
//     if (lastFetchKeyRef.current === currentKey) return;
//     lastFetchKeyRef.current = currentKey;

//     fetchAll();
//   }, [subLoading, isPro]);

//   const fetchAll = async () => {
//     setLoading(true);

//     // only call the Pro-gated reviews endpoint if the plan actually includes it —
//     // Promise.allSettled also means one failure never blocks the other four
//     const calls = [
//       getOrdersApi(),
//       getMenuItemsApi(),
//       getCategoriesApi(),
//       getTablesApi(),
//       isPro ? getReviewsApi() : Promise.resolve({ reviews: [] }),
//     ];

//     const [o, m, c, t, r] = await Promise.allSettled(calls);

//     if (o.status === "fulfilled") setOrders(o.value.orders || []);
//     if (m.status === "fulfilled") setMenuItems(m.value.items || []);
//     if (c.status === "fulfilled") setCategories(c.value.categories || []);
//     if (t.status === "fulfilled") setTables(t.value.tables || []);
//     if (r.status === "fulfilled") setReviews(r.value.reviews || []);

//     setLoading(false);
//   };

//   // const totalRevenue = orders
//   //   .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
//   //   .reduce((s, o) => s + o.totalAmount, 0);

//   // helper — check if a date falls within today
//   const isToday = (dateStr) => {
//     const date = new Date(dateStr);
//     const today = new Date();
//     return (
//       date.getDate() === today.getDate() &&
//       date.getMonth() === today.getMonth() &&
//       date.getFullYear() === today.getFullYear()
//     );
//   };

//   // replace your existing totalRevenue calculation with this
//   const todaysRevenue = orders
//     .filter(
//       (o) =>
//         o.status === "Completed" &&
//         o.paymentStatus === "paid" &&
//         isToday(o.createdAt),
//     )
//     .reduce((s, o) => s + o.totalAmount, 0);

//   const todaysOrderCount = orders.filter((o) => isToday(o.createdAt)).length;

//   const pendingOrders = orders.filter((o) => o.status === "Pending").length;
//   const preparingOrders = orders.filter((o) => o.status === "Preparing").length;

//   // const completedOrders = orders.filter((o) => o.status === "Completed").length;
//   const todaysCompletedOrders = orders.filter(
//   (o) => o.status === "Completed" && isToday(o.createdAt)
//   ).length;

//   const recentOrders = [...orders].slice(0, 5);

//   if (subLoading || loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="text-slate-400 text-sm animate-pulse">
//             Loading dashboard...
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Dashboard</h2>
//           <p className="text-slate-400 text-sm mt-1">
//             Welcome back — here's what's happening today
//           </p>
//         </div>
//         <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
//           <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//           <span className="text-slate-300 text-sm font-medium">Live</span>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//         <StatCard
//           // icon="💰"
//           icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
//           // icon={<HandCoins className="w-6 h-6 text-emerald-400" />}
//           label="Today's Revenue"
//           value={`₹${todaysRevenue.toLocaleString()}`}
//           sub={`from ${todaysOrderCount} orders today`}
//           color="green"
//         />

//         {/* <StatCard icon="💰" label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub={`from ${orders.length} orders`} color="green" /> */}

//         <StatCard
//           // icon="📋"
//           icon={<Hourglass className="w-6 h-6 text-amber-400" />}
//           label="Pending Orders"
//           value={pendingOrders}
//           sub={`${preparingOrders} preparing`}
//           color="amber"
//         />
//         <StatCard
//           // icon="🍽️"
//           icon={<UtensilsCrossed className="w-6 h-6 text-pink-400" />}
//           label="Menu Items"
//           value={menuItems.length}
//           sub={`${categories.length} categories`}
//           color="blue"
//         />
//         <StatCard
//           // icon="⭐"
//           icon = {<Star className="w-5 h-5 text-yellow-400" />}
//           label="Reviews"
//           value={reviews.length}
//           sub={`${tables.length} tables active`}
//           color="purple"
//           locked={!isPro}
//         />
//       </div>

//       <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
//         <h3 className="text-white font-bold text-base mb-5">
//           Order Status Overview
//         </h3>
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {[
//             {
//               label: "Pending",
//               count: pendingOrders,
//               color: "text-amber-400",
//               bg: "bg-amber-400/10",
//               border: "border-amber-400/20",
//             },
//             {
//               label: "Preparing",
//               count: preparingOrders,
//               color: "text-blue-400",
//               bg: "bg-blue-400/10",
//               border: "border-blue-400/20",
//             },
//             {
//               label: "Ready",
//               count: orders.filter((o) => o.status === "Ready").length,
//               color: "text-purple-400",
//               bg: "bg-purple-400/10",
//               border: "border-purple-400/20",
//             },
//             {
//               label: "Completed",
//               // count: completedOrders,
//               count: todaysCompletedOrders,
//               color: "text-green-400",
//               bg: "bg-green-400/10",
//               border: "border-green-400/20",
//               sub: true //new
//             },
//           ].map((s) => (
//             <div
//               key={s.label}
//               className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}
//             >
//               <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
//               <div className="text-slate-400 text-xs font-medium mt-1">
//                 {s.label}
//                 {s.sub && <span className="block text-slate-500 text-[10px] font-normal mt-0.5">Today's completed orders</span>}

//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"> */}
//       <div className="space-y-4">
//         {/* <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"> */}
//         <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-white font-bold text-base">Recent Orders</h3>
//             <Link
//               to="/restaurant/orders"
//               className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors"
//             >
//               View all →
//             </Link>
//           </div>

//           {recentOrders.length === 0 ? (
//             <div className="text-center py-10 text-slate-400">
//               <div className="text-4xl mb-3">📋</div>
//               <div className="font-semibold text-sm">No orders yet</div>
//               <div className="text-xs mt-1">
//                 Share your QR codes so customers can order
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               {recentOrders.map((order) => (
//                 <div
//                   key={order._id}
//                   className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
//                 >
//                   <div className="flex-1 min-w-0">
//                     <div className="text-white font-semibold text-sm">
//                       {order.tableId?.name || "Unknown Table"} ·{" "}
//                       {order.items.length} item
//                       {order.items.length !== 1 ? "s" : ""}
//                     </div>
//                     <div className="text-slate-400 text-xs mt-0.5 truncate">
//                       {order.items.map((i) => i.name).join(", ")}
//                     </div>
//                   </div>
//                   <div className="text-right ml-3 shrink-0">
//                     <div className="text-white font-bold text-sm mb-1">
//                       ₹{order.totalAmount}
//                     </div>
//                     <span
//                       className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] || ""}`}
//                     >
//                       {order.status}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }
