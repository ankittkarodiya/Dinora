import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMenuItemsApi } from "../../api/menuItemApi";
import { getCategoriesApi } from "../../api/categoryApi";
import { getTablesApi } from "../../api/tableApi";
import { getMyRestaurantApi } from "../../api/restaurantApi";
import { getReviewsApi } from "../../api/reviewApi";
import { useSubscription } from "../../hooks/useSubscription";
import { useOrders } from "../../context/OrdersContext";

import {
  HandCoins,
  Receipt,
  TrendingUp,
  Hourglass,
  UtensilsCrossed,
  ClipboardList,
  Flame,
  Armchair,
  Ticket,
  PackageX,
  Star,
  MessageSquare,
} from "lucide-react";

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-600",
  Accepted: "bg-blue-50 text-blue-600",
  Preparing: "bg-blue-50 text-blue-600",
  Ready: "bg-blue-50 text-blue-600",
  Served: "bg-green-50 text-green-600",
  Completed: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-50 text-red-600",
};

const LIVE_STATUSES = ["Pending", "Accepted", "Preparing", "Ready", "Served"];

const TONES = {
  ok: "bg-green-50 text-green-600",
  warn: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
  accent: "bg-blue-50 text-blue-600",
  danger: "bg-red-50 text-red-600",
};

function StatCard({ icon, label, value, sub, tone = "accent" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${TONES[tone]}`}>
        {icon}
      </div>
      <div className="text-gray-900 font-bold text-md leading-tight wrap-break-word">{value}</div>
      <div className="text-gray-600 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
    </div>
  );
}


export default function Dashboard() {
  const { orders, loading: ordersLoading } = useOrders();
  const { isPro } = useSubscription();

  const { data: menuItemsData, isLoading: menuItemsLoading } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => {
      const res = await getMenuItemsApi();
      return res.items || [];
    },
  });
  const menuItems = menuItemsData || [];

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesApi();
      return res.categories || [];
    },
  });
  const categories = categoriesData || [];

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await getTablesApi();
      return res.tables || [];
    },
  });
  const tables = tablesData || [];

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await getMyRestaurantApi()).restaurant,
    retry: false,
  });

  // reviews — Pro only
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await getReviewsApi();
      return res.reviews || [];
    },
    enabled: isPro,
  });
  const reviews = reviewsData || [];

  const loading = ordersLoading || menuItemsLoading || categoriesLoading || tablesLoading;

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // ── today's numbers ──
  const todaysRevenue = orders
    .filter((o) => o.status === "Completed" && o.paymentStatus === "paid" && isToday(o.createdAt))
    .reduce((s, o) => s + o.totalAmount, 0);

  const todaysOrders = orders.filter((o) => isToday(o.createdAt) && o.status !== "Cancelled");
  const todaysOrderCount = todaysOrders.length;
  const todaysCancelled = orders.filter((o) => isToday(o.createdAt) && o.status === "Cancelled").length;

  const avgOrderValue =
    todaysOrderCount > 0
      ? Math.round(todaysOrders.reduce((s, o) => s + o.totalAmount, 0) / todaysOrderCount)
      : 0;

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const preparingOrders = orders.filter((o) => o.status === "Preparing").length;

  const cashPending = orders.filter(
    (o) => o.paymentMethod === "cash" && o.paymentStatus !== "paid" && o.status === "Served",
  );
  const cashPendingAmount = cashPending.reduce((s, o) => s + o.totalAmount, 0);

  const itemCounts = {};
  todaysOrders.forEach((o) =>
    o.items.forEach((i) => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
    }),
  );
  const topItemEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0] || null;

  // const regularTables = tables.filter((t) => !t.isKiosk);
  // new
  const regularTables = tables.filter((t) => !t.isKioskTable);

  const occupiedIds = new Set(
    orders.filter((o) => LIVE_STATUSES.includes(o.status)).map((o) => o.tableId?._id || o.tableId),
  );
  const occupiedCount = regularTables.filter((t) => occupiedIds.has(t._id)).length;

  const liveTokenCount = orders.filter((o) => o.tokenActive).length;

  const outOfStock = menuItems.filter((m) => m.isAvailable === false);

  const inKitchen = orders.filter((o) => ["Accepted", "Preparing", "Ready"].includes(o.status)).length;
  const servedNow = orders.filter((o) => o.status === "Served").length;
  const todaysCompletedOrders = orders.filter((o) => o.status === "Completed" && isToday(o.createdAt)).length;

  const recentOrders = [...orders].slice(0, 5);

  // ── Pro-gated computations ──
  const overallAvg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 text-sm animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-gray-900 font-semibold text-3xl">Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">Welcome back — here's what's happening today</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-600 text-sm font-medium">Live</span>
        </div>
      </div>

      {/* ── row 1: the money + the queue ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Today's Revenue"
          value={`₹${todaysRevenue.toLocaleString()}`}
          sub="paid & completed orders"
          tone="ok"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Today's Orders"
          value={todaysOrderCount}
          sub={todaysCancelled > 0 ? `${todaysCancelled} cancelled` : "none cancelled"}
          tone="accent"
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          label="Avg. Order Value"
          value={`₹${avgOrderValue.toLocaleString()}`}
          sub="per order, incl. GST"
          tone="info"
        />
        <StatCard
          icon={<Hourglass className="w-5 h-5" />}
          label="Pending Orders"
          value={pendingOrders}
          sub={`${preparingOrders} preparing`}
          tone="warn"
        />
      </div>

      {/* ── row 2: live floor info ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<HandCoins className="w-5 h-5" />}
          label="Cash to Collect"
          value={`₹${cashPendingAmount.toLocaleString()}`}
          sub={`${cashPending.length} order${cashPending.length !== 1 ? "s" : ""} served, unpaid`}
          tone="ok"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Top Item Today"
          value={topItemEntry ? topItemEntry[0] : "—"}
          sub={topItemEntry ? `${topItemEntry[1]} ordered` : "no orders yet"}
          tone="danger"
        />
        <StatCard
          icon={<Armchair className="w-5 h-5" />}
          label="Tables Occupied"
          value={`${occupiedCount} / ${regularTables.length}`}
          sub={regularTables.length - occupiedCount > 0 ? `${regularTables.length - occupiedCount} free` : "all busy"}
          tone="info"
        />
        <StatCard
          icon={<Ticket className="w-5 h-5" />}
          label="Tokens In Use"
          value={liveTokenCount}
          sub="live orders right now"
          tone="accent"
        />
      </div>

      {/* ── row 3: menu health + reviews ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<PackageX className="w-5 h-5" />}
          label="Out of Stock"
          value={outOfStock.length}
          sub={
            outOfStock.length > 0
              ? outOfStock.slice(0, 2).map((m) => m.name).join(", ") + (outOfStock.length > 2 ? "…" : "")
              : "everything available"
          }
          tone={outOfStock.length > 0 ? "danger" : "ok"}
        />
        <StatCard
          icon={<UtensilsCrossed className="w-5 h-5" />}
          label="Menu Items"
          value={menuItems.length}
          sub={`${categories.length} categories`}
          tone="accent"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={isPro ? overallAvg : "Pro"}
          sub={isPro ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "Upgrade to unlock"}
          tone="warn"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Total Reviews"
          value={isPro ? reviews.length : "Pro"}
          sub={isPro ? (reviews.length > 0 ? `avg ${overallAvg} ★` : "no reviews yet") : "Upgrade to unlock"}
          tone="info"
        />
      </div>

      {/* ── order status overview ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="text-gray-900 font-bold text-base mb-4">Order Status Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Pending", count: pendingOrders, dot: "bg-amber-500" },
            { label: "In Kitchen", count: inKitchen, dot: "bg-blue-500" },
            { label: "Served", count: servedNow, dot: "bg-green-500" },
            { label: "Completed", count: todaysCompletedOrders, dot: "bg-gray-300", sub: "Today" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
              <div className="text-gray-900 text-xl font-bold">{s.count}</div>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-gray-600 text-xs font-medium">{s.label}</span>
              </div>
              {s.sub && <span className="block text-gray-400 text-[10px] mt-1">{s.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── recent orders ── */}
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-bold text-base">Recent Orders</h3>
          <Link
            to="/restaurant/orders"
            className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <div className="flex justify-center mb-3">
              <ClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <div className="font-semibold text-sm">No orders yet</div>
            <div className="text-xs mt-1">Share your QR codes so customers can order</div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {order.tokenNumber != null && (
                    <div className="shrink-0 rounded-lg bg-blue-50 text-blue-600 font-mono font-bold text-sm px-2.5 py-1.5">
                      #{order.tokenNumber}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-gray-900 font-semibold text-sm">
                      {order.tableId?.name || "Unknown Table"} · {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-gray-600 text-xs mt-0.5 truncate">
                      {order.items.map((i) => i.name).join(", ")}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="text-gray-900 font-bold text-sm mb-1">₹{order.totalAmount}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] || ""}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
