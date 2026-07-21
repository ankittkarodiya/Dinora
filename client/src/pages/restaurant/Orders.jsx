import { useState, useEffect, useRef, useMemo } from "react";
import {
  getOrdersApi,
  acceptOrderApi,
  markSlipPrintedApi,
  updateOrderStatusApi,
  cancelOrderApi,
  confirmCashPaymentApi,
} from "../../api/orderApi";
import { getMyRestaurantApi } from "../../api/restaurantApi";
import KitchenSlip from "../../components/admin/KitchenSlip";
import toast from "react-hot-toast";
const STATUS_STYLE = {
  Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Accepted: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Ready: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Served: "bg-green-500/20 text-green-300 border-green-500/30",
  Completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};
const STATUS_ICON = {
  Pending: "",
  Accepted: "",
  Preparing: "",
  Ready: "",
  Served: "",
  Completed: "✓",
  Cancelled: "🚫",
};
// const STATUS_ICON = {
//   Pending: "🕐",
//   Accepted: "✅",
//   Preparing: "⏳",
//   Ready: "♨",
//   Served: "𓌉◯𓇋",
//   Completed: "✨",
//   Cancelled: "🚫",
// };
const ALL_STATUSES = [
  "all",
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Served",
  "Completed",
  "Cancelled",
];
const NEXT_LABEL = { Preparing: "Mark Ready", Ready: "Mark Served" };
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateMode, setDateMode] = useState("all"); // "all" | "pick"
  const [pickedDate, setPickedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const datePickerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [slipOrder, setSlipOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [processingId, setProcessingId] = useState(null); // ← tracks which order is mid-action (Accept/Ready/Served/Confirm Cash)
  const knownOrderIdsRef = useRef(new Set()); // ← tracks which order IDs we've already seen, for new-order detection
  // useEffect(() => {
  //   fetchAll();
  //   const interval = setInterval(fetchOrders, 10000);
  //   return () => clearInterval(interval);
  // }, []);
  const hasFetchedRef = useRef(false);
useEffect(() => {
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchAll(); // ← your initial fetch function
}, []);
useEffect(() => {
  const interval = setInterval(fetchOrders, 10000); // ← leave this one exactly as-is, no guard needed
  return () => clearInterval(interval);
}, []);
  const fetchAll = async () => {
    try {
      const [ordersData, restaurantData] = await Promise.all([
        getOrdersApi(),
        getMyRestaurantApi(),
      ]);
      const initialOrders = ordersData.orders || [];
      knownOrderIdsRef.current = new Set(initialOrders.map((o) => o._id)); // ← seed baseline so first poll doesn't false-positive
      setOrders(initialOrders);
      setRestaurant(restaurantData.restaurant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchOrders = async () => {
    try {
      const data = await getOrdersApi();
      const newOrders = data.orders || [];

      // only run new-order detection once we have a real baseline —
      // skip it on the very first call so existing orders aren't flagged as "new"
      if (knownOrderIdsRef.current.size > 0) {
        const newlyArrived = newOrders.filter(
          (o) => !knownOrderIdsRef.current.has(o._id)
        );
        if (newlyArrived.length > 0) {
          toast.custom(
            (t) => (
              <div className="bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
                ⓘ {newlyArrived.length} new order!{newlyArrived.length > 1 ? "s" : ""}
              </div>
            ),
            { duration: 2000, position: "top-center" }
          );
        }
      }

      knownOrderIdsRef.current = new Set(newOrders.map((o) => o._id));
      setOrders(newOrders);
    } catch {}
  }; 
  const handleAccept = async (id) => {
    if (processingId) return; // ← guard against double-clicks
    setProcessingId(id);
    try {
      const data = await acceptOrderApi(id);
      setOrders((p) => p.map((o) => (o._id === id ? data.order : o)));
      toast.success("Order accepted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setProcessingId(null);
    }
  };
  const handlePrintDone = async (order) => {
    try {
      const data = await markSlipPrintedApi(order._id);
      setOrders((p) => p.map((o) => (o._id === order._id ? data.order : o)));
      setSlipOrder(null);
      // toast.success("Slip printed — sent to kitchen 👨‍🍳");
      toast.success("Started preparing");
    } catch {
      toast.error("Failed to update");
    }
  };
  const handleStatusUpdate = async (orderId, nextStatus) => {
    if (processingId) return; // ← guard against double-clicks
    setProcessingId(orderId);
    try {
      const data = await updateOrderStatusApi(orderId, nextStatus);
      setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
      toast.success(`Marked as ${nextStatus}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setProcessingId(null);
    }
  };
  const handleConfirmCash = async (orderId) => {
    if (processingId) return; // ← guard against double-clicks
    setProcessingId(orderId);
    try {
      const data = await confirmCashPaymentApi(orderId);
      setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
      // toast.success("Cash payment confirmed ✅ Order completed");
      toast.success("Cash payment confirmed");
    } catch {
      toast.error("Failed to confirm");
    } finally {
      setProcessingId(null);
    }
  };
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const data = await cancelOrderApi(cancelModal._id, cancelReason);
      setOrders((p) =>
        p.map((o) => (o._id === cancelModal._id ? data.order : o)),
      );
      toast.success("Order cancelled");
      setCancelModal(null);
      setCancelReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setCancelling(false);
    }
  };
  const isOrderInDateFilter = (order) => {
    if (dateMode === "all") return true;
    const orderDate = new Date(order.createdAt);
    const d = new Date(pickedDate);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orderDate >= d && orderDate < next;
  };
  const filtered = useMemo(() => {
    return orders.filter(
      (o) =>
        (statusFilter === "all" || o.status === statusFilter) &&
        isOrderInDateFilter(o),
    );
  }, [orders, statusFilter, dateMode, pickedDate]);
  // revenue only counts orders actually confirmed paid — never cancelled, never pending
  const periodRevenue = filtered
    .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const cashPendingOrders = orders.filter(
    (o) =>
      o.paymentMethod === "cash" &&
      o.paymentStatus !== "paid" &&
      o.status === "Served",
  );
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading orders...
        </div>
      </div>
    ); 
  return (
    <div className="space-y-5">
      {slipOrder && (
        <KitchenSlip
          order={slipOrder}
          onClose={() => setSlipOrder(null)}
          onPrinted={() => handlePrintDone(slipOrder)}
        />
      )}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-white font-bold text-lg">Cancel Order?</h3>
              <p className="text-slate-400 text-xs mt-1">
                Record will be kept as Cancelled
              </p>
            </div>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)..."
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
                className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Orders</h2>
          <p className="text-slate-400 text-sm mt-1">
            {filtered.length} orders · Revenue: ₹
            {periodRevenue.toLocaleString()}
          </p>
        </div>
        {/* <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold"
        >
          🔄 Refresh
        </button> */}
        <button
        onClick={fetchOrders}
        className="
        px-4 py-2
        rounded-xl
        border border-white/20
        bg-white/10
        hover:bg-white/20
        active:bg-white/30
        active:scale-95
        active:translate-y-0.5
        active:shadow-inner
        transition-all
        duration-100
        ease-out
        text-slate-300
        text-sm
        font-semibold
        cursor-pointer "
        >
          🔄 Refresh
        </button>
      </div>
      {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-semibold text-sm">
              {pendingCount} new order{pendingCount > 1 ? "s" : ""} waiting
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("Pending")}
            className="text-amber-400 text-xs font-bold"
          >
            View →
          </button>
        </div>
      )}       {cashPendingOrders.length > 0 && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center justify-between">
          <span className="text-green-300 font-semibold text-sm">
            💵 {cashPendingOrders.length} cash payment
            {cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
          </span>
          <button
            onClick={() => setStatusFilter("Served")}
            className="text-green-400 text-xs font-bold"
          >
            View →
          </button>
        </div>
      )}
      {/* Date filter — two buttons only */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDateMode("pick");
              requestAnimationFrame(() => {
                datePickerRef.current?.showPicker?.();
              });
            }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              dateMode === "pick"
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"
            }`}
          >
            {/* 📅{" "} */}
            {" "}
            {pickedDate === new Date().toISOString().split("T")[0]
              ? "Today"
              : new Date(pickedDate + "T00:00:00").toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={pickedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              setPickedDate(e.target.value);
              setDateMode("pick");
            }}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
          />
        </div> 
        <button
          onClick={() => setDateMode("all")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${dateMode === "all" ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
        >
          All Time
        </button>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {ALL_STATUSES.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${statusFilter === f ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
          >
            {f === "all" ? "All Status" : `${STATUS_ICON[f]} ${f}`}
            {f !== "all" && orders.filter((o) => o.status === f).length > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">
                {orders.filter((o) => o.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold">No orders found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isCancelled = order.status === "Cancelled";
            const isCompleted = order.status === "Completed";
            const isCashPending =
              order.paymentMethod === "cash" &&
              order.paymentStatus !== "paid" &&
              order.status === "Served";
            const cgst = order.gstAmount / 2;
            const sgst = order.gstAmount / 2;
            const isThisOrderProcessing = processingId === order._id; // ← is THIS specific order mid-action
            return (
              <div
                key={order._id}
                className={`rounded-2xl border backdrop-blur-sm p-5 transition-all ${
                  isCancelled
                    ? "border-red-500/20 bg-red-500/5 opacity-75"
                    : order.status === "Pending"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : order.status === "Accepted"
                        ? "border-cyan-500/30 bg-cyan-500/5"
                        : isCashPending
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">
                        {order.tableId?.name || "Unknown"}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {order.customerId?.username || "Guest"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      at{" "}
                      {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLE[order.status]}`}
                  >
                    {STATUS_ICON[order.status]} {order.status}
                  </span>
                </div> 
                {isCancelled && order.cancellationReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3 text-red-300 text-xs">
                    <span className="font-bold">Reason: </span>
                    {order.cancellationReason}
                  </div>
                )}
                <div
                  className={`space-y-1.5 mb-3 rounded-xl p-3 ${isCancelled ? "bg-white/3" : "bg-white/5"}`}
                >
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center ${isCancelled ? "opacity-40 line-through" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-sm border ${item.isVeg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}
                          />
                        </div>
                        <span className="text-slate-200 text-sm">
                          {item.name}
                        </span>
                        <span className="text-slate-400 text-xs">
                          × {item.qty}
                        </span>
                      </div>
                      <span className="text-slate-300 text-sm font-semibold">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  ))}
                </div>
                {/* GST breakdown — real numbers, snapshotted at order time */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">Subtotal</div>
                    <div className="text-slate-300 font-semibold">
                      ₹{order.subtotal.toFixed(2)}
                      {/* temp fix */}
                      {/* ₹{(order.subtotal ?? 0).toFixed(2)} */}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">
                      CGST+SGST ({order.gstPercent}%)
                    </div>
                    <div className="text-slate-300 font-semibold">
                      ₹{order.gstAmount.toFixed(2)}
                      {/* temp fix */}
                      {/* ₹{(order.gstAmount ?? 0).toFixed(2)} */}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">Total</div>
                    <div className="text-white font-bold">
                      ₹{order.totalAmount.toFixed(2)}
                      {/* temp fix */}
                      {/* ₹{(order.totalAmount ?? 0).toFixed(2)} */}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  {/* Payment badge — ONLY shown once Completed, nothing before */}
                  {isCompleted ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-green-500/20 text-green-300 border-green-500/30">
                      ✓ Paid ·{" "}
                      {order.paymentMethod === "online" ? "Online" : "Cash"}
                    </span>
                  ) : isCancelled ? (
                    <span className="text-red-400 text-xs font-bold">
                      🚫 Cancelled
                    </span>
                  ) : (
                    <span />
                  )} 
                  <div className="flex gap-2 flex-wrap justify-end">
                    {order.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(order._id)}
                          disabled={isThisOrderProcessing}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isThisOrderProcessing ? "Accepting..." : "Accept"}
                        </button>
                        <button
                          onClick={() => setCancelModal(order)}
                          disabled={isThisOrderProcessing}
                          className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === "Accepted" && (
                      <button
                        onClick={() => setSlipOrder(order)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        🖨️ Print & Send to Kitchen
                      </button>
                    )}
                    {order.status === "Preparing" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "Ready")}
                        disabled={isThisOrderProcessing}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isThisOrderProcessing ? "Updating..." : "Mark Ready"}
                      </button>
                    )}
                    {order.status === "Ready" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "Served")}
                        disabled={isThisOrderProcessing}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isThisOrderProcessing ? "Updating..." : "Mark Served"}
                      </button>
                    )}
                    {isCashPending && (
                      <button
                        onClick={() => handleConfirmCash(order._id)}
                        disabled={isThisOrderProcessing}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isThisOrderProcessing ? "Confirming..." : "₹ Confirm Cash Received"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

























// import { useState, useEffect, useRef, useMemo } from "react";
// import {
//   getOrdersApi,
//   acceptOrderApi,
//   markSlipPrintedApi,
//   updateOrderStatusApi,
//   cancelOrderApi,
//   confirmCashPaymentApi,
// } from "../../api/orderApi";
// import { getMyRestaurantApi } from "../../api/restaurantApi";
// import KitchenSlip from "../../components/admin/KitchenSlip";
// import toast from "react-hot-toast";

// const STATUS_STYLE = {
//   Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
//   Accepted: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
//   Preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
//   Ready: "bg-purple-500/20 text-purple-300 border-purple-500/30",
//   Served: "bg-green-500/20 text-green-300 border-green-500/30",
//   Completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
//   Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
// };
// const STATUS_ICON = {
//   Pending: "",
//   Accepted: "",
//   Preparing: "",
//   Ready: "",
//   Served: "",
//   Completed: "✓",
//   Cancelled: "🚫",
// };
// // const STATUS_ICON = {
// //   Pending: "🕐",
// //   Accepted: "✅",
// //   Preparing: "⏳",
// //   Ready: "♨",
// //   Served: "𓌉◯𓇋",
// //   Completed: "✨",
// //   Cancelled: "🚫",
// // };
// const ALL_STATUSES = [
//   "all",
//   "Pending",
//   "Accepted",
//   "Preparing",
//   "Ready",
//   "Served",
//   "Completed",
//   "Cancelled",
// ];
// const NEXT_LABEL = { Preparing: "Mark Ready", Ready: "Mark Served" };

// export default function Orders() {
//   const [orders, setOrders] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateMode, setDateMode] = useState("all"); // "all" | "pick"
//   const [pickedDate, setPickedDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );
//   const datePickerRef = useRef(null);
//   const [loading, setLoading] = useState(true);
//   const [slipOrder, setSlipOrder] = useState(null);
//   const [cancelModal, setCancelModal] = useState(null);
//   const [cancelReason, setCancelReason] = useState("");
//   const [cancelling, setCancelling] = useState(false);

//   // useEffect(() => {
//   //   fetchAll();
//   //   const interval = setInterval(fetchOrders, 10000);
//   //   return () => clearInterval(interval);
//   // }, []);

//   const hasFetchedRef = useRef(false);

// useEffect(() => {
//   if (hasFetchedRef.current) return;
//   hasFetchedRef.current = true;
//   fetchAll(); // ← your initial fetch function
// }, []);

// useEffect(() => {
//   const interval = setInterval(fetchOrders, 10000); // ← leave this one exactly as-is, no guard needed
//   return () => clearInterval(interval);
// }, []);


//   const fetchAll = async () => {
//     try {
//       const [ordersData, restaurantData] = await Promise.all([
//         getOrdersApi(),
//         getMyRestaurantApi(),
//       ]);
//       setOrders(ordersData.orders || []);
//       setRestaurant(restaurantData.restaurant);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOrders = async () => {
//     try {
//       const data = await getOrdersApi();
//       setOrders(data.orders || []);
//     } catch {}
//   };

//   const handleAccept = async (id) => {
//     try {
//       const data = await acceptOrderApi(id);
//       setOrders((p) => p.map((o) => (o._id === id ? data.order : o)));
//       toast.success("Order accepted ✅");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed");
//     }
//   };

//   const handlePrintDone = async (order) => {
//     try {
//       const data = await markSlipPrintedApi(order._id);
//       setOrders((p) => p.map((o) => (o._id === order._id ? data.order : o)));
//       setSlipOrder(null);
//       toast.success("Slip printed — sent to kitchen 👨‍🍳");
//     } catch {
//       toast.error("Failed to update");
//     }
//   };

//   const handleStatusUpdate = async (orderId, nextStatus) => {
//     try {
//       const data = await updateOrderStatusApi(orderId, nextStatus);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       toast.success(`Marked as ${nextStatus}`);
//     } catch {
//       toast.error("Failed to update");
//     }
//   };

//   const handleConfirmCash = async (orderId) => {
//     try {
//       const data = await confirmCashPaymentApi(orderId);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       toast.success("Cash payment confirmed ✅ Order completed");
//     } catch {
//       toast.error("Failed to confirm");
//     }
//   };

//   const handleCancel = async () => {
//     setCancelling(true);
//     try {
//       const data = await cancelOrderApi(cancelModal._id, cancelReason);
//       setOrders((p) =>
//         p.map((o) => (o._id === cancelModal._id ? data.order : o)),
//       );
//       toast.success("Order cancelled");
//       setCancelModal(null);
//       setCancelReason("");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed");
//     } finally {
//       setCancelling(false);
//     }
//   };

//   const isOrderInDateFilter = (order) => {
//     if (dateMode === "all") return true;
//     const orderDate = new Date(order.createdAt);
//     const d = new Date(pickedDate);
//     d.setHours(0, 0, 0, 0);
//     const next = new Date(d);
//     next.setDate(next.getDate() + 1);
//     return orderDate >= d && orderDate < next;
//   };

//   const filtered = useMemo(() => {
//     return orders.filter(
//       (o) =>
//         (statusFilter === "all" || o.status === statusFilter) &&
//         isOrderInDateFilter(o),
//     );
//   }, [orders, statusFilter, dateMode, pickedDate]);

//   // revenue only counts orders actually confirmed paid — never cancelled, never pending
//   const periodRevenue = filtered
//     .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
//     .reduce((s, o) => s + o.totalAmount, 0);

//   const pendingCount = orders.filter((o) => o.status === "Pending").length;
//   const cashPendingOrders = orders.filter(
//     (o) =>
//       o.paymentMethod === "cash" &&
//       o.paymentStatus !== "paid" &&
//       o.status === "Served",
//   );

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-slate-400 text-sm animate-pulse">
//           Loading orders...
//         </div>
//       </div>
//     );

//   return (
//     <div className="space-y-5">
//       {slipOrder && (
//         <KitchenSlip
//           order={slipOrder}
//           onClose={() => setSlipOrder(null)}
//           onPrinted={() => handlePrintDone(slipOrder)}
//         />
//       )}

//       {cancelModal && (
//         <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4">
//           <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6">
//             <div className="text-center mb-5">
//               <div className="text-4xl mb-3">⚠️</div>
//               <h3 className="text-white font-bold text-lg">Cancel Order?</h3>
//               <p className="text-slate-400 text-xs mt-1">
//                 Record will be kept as Cancelled
//               </p>
//             </div>
//             <input
//               type="text"
//               value={cancelReason}
//               onChange={(e) => setCancelReason(e.target.value)}
//               placeholder="Reason (optional)..."
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none mb-4"
//             />
//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   setCancelModal(null);
//                   setCancelReason("");
//                 }}
//                 className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm"
//               >
//                 Keep
//               </button>
//               <button
//                 onClick={handleCancel}
//                 disabled={cancelling}
//                 className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
//               >
//                 {cancelling ? "Cancelling..." : "Cancel Order"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Orders</h2>
//           <p className="text-slate-400 text-sm mt-1">
//             {filtered.length} orders · Revenue: ₹
//             {periodRevenue.toLocaleString()}
//           </p>
//         </div>
//         {/* <button
//           onClick={fetchOrders}
//           className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold"
//         >
//           🔄 Refresh
//         </button> */}
//         <button
//         onClick={fetchOrders}
//         className="
//         px-4 py-2
//         rounded-xl
//         border border-white/20
//         bg-white/10
//         hover:bg-white/20
//         active:bg-white/30
//         active:scale-95
//         active:translate-y-0.5
//         active:shadow-inner
//         transition-all
//         duration-100
//         ease-out
//         text-slate-300
//         text-sm
//         font-semibold
//         cursor-pointer "
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {pendingCount > 0 && (
//         <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
//             <span className="text-amber-300 font-semibold text-sm">
//               {pendingCount} new order{pendingCount > 1 ? "s" : ""} waiting
//             </span>
//           </div>
//           <button
//             onClick={() => setStatusFilter("Pending")}
//             className="text-amber-400 text-xs font-bold"
//           >
//             View →
//           </button>
//         </div>
//       )}
//       {cashPendingOrders.length > 0 && (
//         <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center justify-between">
//           <span className="text-green-300 font-semibold text-sm">
//             💵 {cashPendingOrders.length} cash payment
//             {cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
//           </span>
//           <button
//             onClick={() => setStatusFilter("Served")}
//             className="text-green-400 text-xs font-bold"
//           >
//             View →
//           </button>
//         </div>
//       )}

//       {/* Date filter — two buttons only */}
//       <div className="flex items-center gap-2">
//         {/* <button
//           onClick={() => setDateMode("all")}
//           className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${dateMode === "all" ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
//         >
//           All Time
//         </button> */}

//         {/* <div className="relative">
//           <button
//             onClick={() => datePickerRef.current?.showPicker()}
//             className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${dateMode === "pick" ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
//           >
//             📅{" "}
//             {dateMode === "pick"
//               ? pickedDate === new Date().toISOString().split("T")[0]
//                 ? "Today"
//                 : new Date(pickedDate + "T00:00:00").toLocaleDateString(
//                     "en-IN",
//                     { day: "2-digit", month: "short", year: "numeric" },
//                   )
//               : "Pick Date"}
//           </button>
//           <input
//             ref={datePickerRef}
//             type="date"
//             value={pickedDate}
//             max={new Date().toISOString().split("T")[0]}
//             onChange={(e) => {
//               setPickedDate(e.target.value);
//               setDateMode("pick");
//             }}
//             className="absolute inset-0 opacity-0 pointer-events-none"
//           />
//         </div> */}

//         <div className="relative">
//           <button
//             type="button"
//             onClick={() => {
//               setDateMode("pick");
//               requestAnimationFrame(() => {
//                 datePickerRef.current?.showPicker?.();
//               });
//             }}
//             className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
//               dateMode === "pick"
//                 ? "bg-blue-600 text-white"
//                 : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"
//             }`}
//           >
//             {/* 📅{" "} */}
//             {" "}
//             {pickedDate === new Date().toISOString().split("T")[0]
//               ? "Today"
//               : new Date(pickedDate + "T00:00:00").toLocaleDateString("en-IN", {
//                   day: "2-digit",
//                   month: "short",
//                   year: "numeric",
//                 })}
//           </button>
//           <input
//             ref={datePickerRef}
//             type="date"
//             value={pickedDate}
//             max={new Date().toISOString().split("T")[0]}
//             onChange={(e) => {
//               setPickedDate(e.target.value);
//               setDateMode("pick");
//             }}
//             className="absolute inset-0 opacity-0 pointer-events-none"
//             tabIndex={-1}
//           />
//         </div>

//         <button
//           onClick={() => setDateMode("all")}
//           className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${dateMode === "all" ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
//         >
//           All Time
//         </button>
//       </div>

//       <div
//         className="flex gap-2 overflow-x-auto pb-1"
//         style={{ scrollbarWidth: "none" }}
//       >
//         {ALL_STATUSES.map((f) => (
//           <button
//             key={f}
//             onClick={() => setStatusFilter(f)}
//             className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${statusFilter === f ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
//           >
//             {f === "all" ? "All Status" : `${STATUS_ICON[f]} ${f}`}
//             {f !== "all" && orders.filter((o) => o.status === f).length > 0 && (
//               <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">
//                 {orders.filter((o) => o.status === f).length}
//               </span>
//             )}
//           </button>
//         ))}
//       </div>

//       {filtered.length === 0 ? (
//         <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
//           <div className="text-4xl mb-3">📋</div>
//           <div className="font-semibold">No orders found</div>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {filtered.map((order) => {
//             const isCancelled = order.status === "Cancelled";
//             const isCompleted = order.status === "Completed";
//             const isCashPending =
//               order.paymentMethod === "cash" &&
//               order.paymentStatus !== "paid" &&
//               order.status === "Served";
//             const cgst = order.gstAmount / 2;
//             const sgst = order.gstAmount / 2;

//             return (
//               <div
//                 key={order._id}
//                 className={`rounded-2xl border backdrop-blur-sm p-5 transition-all ${
//                   isCancelled
//                     ? "border-red-500/20 bg-red-500/5 opacity-75"
//                     : order.status === "Pending"
//                       ? "border-amber-500/30 bg-amber-500/5"
//                       : order.status === "Accepted"
//                         ? "border-cyan-500/30 bg-cyan-500/5"
//                         : isCashPending
//                           ? "border-green-500/30 bg-green-500/5"
//                           : "border-white/10 bg-white/5"
//                 }`}
//               >
//                 <div className="flex items-start justify-between mb-3">
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <span className="text-white font-bold text-base">
//                         {order.tableId?.name || "Unknown"}
//                       </span>
//                       <span className="text-slate-500 text-xs font-mono">
//                         #{order._id.slice(-6).toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="text-slate-400 text-xs mt-0.5">
//                       {order.customerId?.username || "Guest"} ·{" "}
//                       {new Date(order.createdAt).toLocaleDateString("en-IN", {
//                         day: "2-digit",
//                         month: "short",
//                       })}{" "}
//                       at{" "}
//                       {new Date(order.createdAt).toLocaleTimeString("en-IN", {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </div>
//                   </div>
//                   <span
//                     className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_STYLE[order.status]}`}
//                   >
//                     {STATUS_ICON[order.status]} {order.status}
//                   </span>
//                 </div>

//                 {isCancelled && order.cancellationReason && (
//                   <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3 text-red-300 text-xs">
//                     <span className="font-bold">Reason: </span>
//                     {order.cancellationReason}
//                   </div>
//                 )}

//                 <div
//                   className={`space-y-1.5 mb-3 rounded-xl p-3 ${isCancelled ? "bg-white/3" : "bg-white/5"}`}
//                 >
//                   {order.items.map((item, i) => (
//                     <div
//                       key={i}
//                       className={`flex justify-between items-center ${isCancelled ? "opacity-40 line-through" : ""}`}
//                     >
//                       <div className="flex items-center gap-2">
//                         <div
//                           className={`w-3 h-3 rounded-sm border ${item.isVeg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}
//                         >
//                           <div
//                             className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}
//                           />
//                         </div>
//                         <span className="text-slate-200 text-sm">
//                           {item.name}
//                         </span>
//                         <span className="text-slate-400 text-xs">
//                           × {item.qty}
//                         </span>
//                       </div>
//                       <span className="text-slate-300 text-sm font-semibold">
//                         ₹{item.price * item.qty}
//                       </span>
//                     </div>
//                   ))}
//                 </div>

//                 {/* GST breakdown — real numbers, snapshotted at order time */}
//                 <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
//                   <div className="bg-white/5 rounded-lg px-3 py-2">
//                     <div className="text-slate-500">Subtotal</div>
//                     <div className="text-slate-300 font-semibold">
//                       ₹{order.subtotal.toFixed(2)}
//                       {/* temp fix */}
//                       {/* ₹{(order.subtotal ?? 0).toFixed(2)} */}
//                     </div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg px-3 py-2">
//                     <div className="text-slate-500">
//                       CGST+SGST ({order.gstPercent}%)
//                     </div>
//                     <div className="text-slate-300 font-semibold">
//                       ₹{order.gstAmount.toFixed(2)}
//                       {/* temp fix */}
//                       {/* ₹{(order.gstAmount ?? 0).toFixed(2)} */}
//                     </div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg px-3 py-2">
//                     <div className="text-slate-500">Total</div>
//                     <div className="text-white font-bold">
//                       ₹{order.totalAmount.toFixed(2)}
//                       {/* temp fix */}
//                       {/* ₹{(order.totalAmount ?? 0).toFixed(2)} */}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between pt-3 border-t border-white/10">
//                   {/* Payment badge — ONLY shown once Completed, nothing before */}
//                   {isCompleted ? (
//                     <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-green-500/20 text-green-300 border-green-500/30">
//                       ✓ Paid ·{" "}
//                       {order.paymentMethod === "online" ? "Online" : "Cash"}
//                     </span>
//                   ) : isCancelled ? (
//                     <span className="text-red-400 text-xs font-bold">
//                       🚫 Cancelled
//                     </span>
//                   ) : (
//                     <span />
//                   )}

//                   <div className="flex gap-2 flex-wrap justify-end">
//                     {order.status === "Pending" && (
//                       <>
//                         <button
//                           onClick={() => handleAccept(order._id)}
//                           className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold"
//                         >
//                           Accept
//                         </button>
//                         <button
//                           onClick={() => setCancelModal(order)}
//                           className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold"
//                         >
//                           Cancel
//                         </button>
//                       </>
//                     )}
//                     {order.status === "Accepted" && (
//                       <button
//                         onClick={() => setSlipOrder(order)}
//                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
//                       >
//                         🖨️ Print & Send to Kitchen
//                       </button>
//                     )}
//                     {order.status === "Preparing" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Ready")}
//                         className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
//                       >
//                         Mark Ready
//                       </button>
//                     )}
//                     {order.status === "Ready" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Served")}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold"
//                       >
//                         Mark Served
//                       </button>
//                     )}
//                     {isCashPending && (
//                       <button
//                         onClick={() => handleConfirmCash(order._id)}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold"
//                       >
//                         ₹ Confirm Cash Received
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }