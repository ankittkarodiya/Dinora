import { useState, useMemo, useRef } from "react";
import {
  acceptOrderApi,
  markSlipPrintedApi,
  updateOrderStatusApi,
  cancelOrderApi,
  confirmCashPaymentApi,
} from "../../api/orderApi";
import KitchenSlip from "../../components/admin/KitchenSlip";
import toast from "react-hot-toast";
import { useOrders } from "../../context/OrdersContext";
import { ClipboardList } from "lucide-react";

// ← Local-date helper, replacing every UTC-based toISOString().split("T")[0]
// call in this file. toISOString() reports the date in UTC — for any
// timezone ahead of UTC (India, UTC+5:30), right after local midnight but
// before UTC midnight, it still reports YESTERDAY's date. That mismatch is
// exactly why "Today" excluded orders placed just after midnight IST.
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  // ── Live order data now comes from the shared context ──────────────
  // No local polling, no local socket setup — OrdersProvider (mounted at
  // the layout level) handles all of that and keeps this data current
  // in real time, even while the admin is on a completely different page.
  const { orders, loading, updateOrderInList, refetchOrders } = useOrders();

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateMode, setDateMode] = useState("pick"); // "pick" | "all" — defaults to Today
  // const [pickedDate, setPickedDate] = useState(
  //   new Date().toISOString().split("T")[0],
  // );
  const [pickedDate, setPickedDate] = useState(getLocalDateString());

  const datePickerRef = useRef(null);

  // ── Kitchen slip modal — derived fresh from `orders` every render, so
  // it always reflects the latest data for that order, never a stale
  // snapshot frozen at the moment it was opened ──────────────────────
  const [slipOrderId, setSlipOrderId] = useState(null);
  const slipOrder = orders.find((o) => o._id === slipOrderId) || null;

  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [processingId, setProcessingId] = useState(null); // which order is mid-action

  // ── Order actions — each one patches the shared context's order list
  // via updateOrderInList, so every page reading from context (the
  // sidebar badge, this page) sees the update immediately ──────────────

  const handleAccept = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const data = await acceptOrderApi(id);
      updateOrderInList(id, data.order);
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
      updateOrderInList(order._id, data.order);
      setSlipOrderId(null);
      toast.success("Started preparing");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    if (processingId) return;
    setProcessingId(orderId);
    try {
      const data = await updateOrderStatusApi(orderId, nextStatus);
      updateOrderInList(orderId, data.order);
      toast.success(`Marked as ${nextStatus}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmCash = async (orderId) => {
    if (processingId) return;
    setProcessingId(orderId);
    try {
      const data = await confirmCashPaymentApi(orderId);
      updateOrderInList(orderId, data.order);
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
      updateOrderInList(cancelModal._id, data.order);
      toast.success("Order cancelled");
      setCancelModal(null);
      setCancelReason("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setCancelling(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────

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

  const periodRevenue = filtered
    .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  // const pendingCount = orders.filter((o) => o.status === "Pending").length;
  // new
  const pendingCount = orders.filter((o) => o.status === "Pending" && isOrderInDateFilter(o)).length;
  const cashPendingOrders = orders.filter(
    (o) =>
      o.paymentMethod === "cash" &&
      o.paymentStatus !== "paid" &&
      // o.status === "Served",
      // new
      o.status === "Served" &&
      isOrderInDateFilter(o),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {slipOrder && (
        <KitchenSlip
          order={slipOrder}
          onClose={() => setSlipOrderId(null)}
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
        <button
          onClick={refetchOrders}
          className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 active:translate-y-0.5 active:shadow-inner transition-all duration-100 ease-out text-slate-300 text-sm font-semibold cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {/* {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          {/* <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-semibold text-sm">
              {pendingCount} new order{pendingCount > 1 ? "s" : ""} waiting
            </span>
          </div> 

          {/* new 
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
             {pendingCount}
            </div>
            <span className="text-amber-300 font-semibold text-sm">
              new order{pendingCount > 1 ? "s" : ""} waiting
            </span>
          </div>
          
          <button
            onClick={() => setStatusFilter("Pending")}
            className="text-amber-400 text-xs font-bold"
          >
            View →
          </button>
        </div>
      )} */}

      {/* new */}
      {pendingCount > 0 && (
  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 flex items-center justify-center text-[11px] font-bold shrink-0">
        {pendingCount}
      </div>
      <span className="text-slate-400 font-medium text-sm">
        new order{pendingCount > 1 ? "s" : ""} waiting
      </span>
    </div>
    <button
      onClick={() => setStatusFilter("Pending")}
      className="text-amber-400/80 text-xs font-semibold"
    >
      View →
    </button>
  </div>
)}



      {/* {cashPendingOrders.length > 0 && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center justify-between">
          <span className="text-green-300 font-semibold text-sm">
            {cashPendingOrders.length} cash payment
            {cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
          </span> 

          {/* new 
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
               {cashPendingOrders.length}
              </div>
              <span className="text-green-300 font-semibold text-sm">
               cash payment{cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
              </span>
            </div>

          <button
            onClick={() => setStatusFilter("Served")}
            className="text-green-400 text-xs font-bold"
          >
            View →
          </button>
        </div>
      )} */}

      {/* new */}
      {cashPendingOrders.length > 0 && (
  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-400/30 text-green-300 flex items-center justify-center text-[11px] font-bold shrink-0">
        {cashPendingOrders.length}
      </div>
      <span className="text-slate-400 font-medium text-sm">
        cash payment{cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
      </span>
    </div>
    <button
      onClick={() => setStatusFilter("Served")}
      className="text-green-400/80 text-xs font-semibold"
    >
      View →
    </button>
  </div>
)}

      {/* Date filter — two buttons only */}
      <div className="flex items-center gap-2">
        <div className="relative">
          {/* <button
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
          /> */}

          {/* new */}
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
            {pickedDate === getLocalDateString()
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
            max={getLocalDateString()}
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

            {/* {f !== "all" && orders.filter((o) => o.status === f).length > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">
                {orders.filter((o) => o.status === f).length}
              </span>
            )} */}
            {f !== "all" && orders.filter((o) => o.status === f && isOrderInDateFilter(o)).length > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full">
                {orders.filter((o) => o.status === f && isOrderInDateFilter(o)).length}
              </span>
            )}

          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
          {/* <div className="text-4xl mb-3">📋</div> */}
          {/* <div className="flex justify-center mb-3">
            <ClipboardList className="w-10 h-10 text-orange-400" />
          </div> */}

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
            const isThisOrderProcessing = processingId === order._id;

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
                      {order.customerId?.username || "Guest"}
                      {order.customerId?.phone && (
                        <span className="text-slate-500">
                          {" "}
                          · {order.customerId.phone.replace(/^\+?91/, "")}
                        </span>
                      )}{" "}
                      ·{" "}
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

                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">Subtotal</div>
                    <div className="text-slate-300 font-semibold">
                      ₹{order.subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">
                      CGST+SGST ({order.gstPercent}%)
                    </div>
                    <div className="text-slate-300 font-semibold">
                      ₹{order.gstAmount.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg px-3 py-2">
                    <div className="text-slate-500">Total</div>
                    <div className="text-white font-bold">
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
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
                        onClick={() => setSlipOrderId(order._id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 shrink-0"
                        >
                          <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16a2 2 0 012 2v6h-4M2 17v-6a2 2 0 012-2" />
                        </svg>
                        <span>Print &amp; Send to Kitchen</span>
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
                        {isThisOrderProcessing
                          ? "Confirming..."
                          : "Confirm Cash Received"}
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
// import { isNotificationSoundEnabled, getSelectedSound } from "../../utils/notificationPrefs";
// import { playSound, unlockAudio } from "../../utils/notificationSounds";

// // ── Status display config ──────────────────────────────────────────
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
//   // ── Race-condition guard for polling ───────────────────────────────
//   // Every call to fetchOrders() gets its own increasing ID. If an older,
//   // slower request finishes AFTER a newer one, its result is discarded —
//   // otherwise stale data could silently overwrite fresher data on screen.
//   const latestFetchIdRef = useRef(0);

//   // ── Core order data ─────────────────────────────────────────────────
//   const [orders, setOrders] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // ── Filters ─────────────────────────────────────────────────────────
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateMode, setDateMode] = useState("pick"); // "pick" | "all" — defaults to Today, not All Time
//   const [pickedDate, setPickedDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );
//   const datePickerRef = useRef(null);

//   // ── Kitchen slip modal ──────────────────────────────────────────────
//   // We store only the ID, not a snapshot of the order object. slipOrder
//   // below is derived fresh from `orders` every render, so if the order's
//   // data changes (e.g. customer info arrives a moment after order creation),
//   // the open modal automatically reflects the correction — it can never
//   // go stale the way storing a full object snapshot would.
//   const [slipOrderId, setSlipOrderId] = useState(null);
//   const slipOrder = orders.find((o) => o._id === slipOrderId) || null;

//   // ── Cancel modal ────────────────────────────────────────────────────
//   const [cancelModal, setCancelModal] = useState(null);
//   const [cancelReason, setCancelReason] = useState("");
//   const [cancelling, setCancelling] = useState(false);

//   // ── Per-order action loading state ─────────────────────────────────
//   const [processingId, setProcessingId] = useState(null); // which order is mid-action (Accept/Ready/Served/Confirm Cash)

//   // ── New-order detection (for toast + sound) ────────────────────────
//   const knownOrderIdsRef = useRef(new Set());

//   // ── Guards against React StrictMode double-firing the initial fetch ─
//   const hasFetchedRef = useRef(false);

//   // ── Pro plan check ──────────────────────────────────────────────────
//   // Notification sound is a Pro-only feature.
//   const restaurantIsPro = restaurant?.subscriptionPlan === "pro";

//   // ── THE FIX for the sound-never-plays bug ──────────────────────────
//   // The polling interval below (setInterval(fetchOrders, 10000)) is set up
//   // ONCE on mount, with an empty dependency array. That means the
//   // `fetchOrders` function it captured is permanently frozen with whatever
//   // values existed at that exact moment — including `restaurantIsPro`,
//   // which starts as `false` because `restaurant` hasn't loaded yet.
//   // `setInterval` never "refreshes" its captured function, so every poll
//   // after that, forever, was checking a permanently stale `false`, even
//   // after the real restaurant data loaded and the UI correctly showed Pro.
//   //
//   // The fix: keep a ref in sync with the real value, and read the ref's
//   // .current property inside fetchOrders instead of the closured variable.
//   // Refs are mutated directly, not captured by closures, so reading
//   // .current always gets the truly current value, no matter how old the
//   // surrounding function is.
//   const restaurantIsProRef = useRef(false);
//   useEffect(() => {
//     restaurantIsProRef.current = restaurantIsPro;
//   }, [restaurantIsPro]);

//   // ── Initial data load (runs once) ──────────────────────────────────
//   useEffect(() => {
//     if (hasFetchedRef.current) return;
//     hasFetchedRef.current = true;
//     fetchAll();
//   }, []);

//   // ── Unlock audio on first real click ────────────────────────────────
//   // Browsers only allow an AudioContext to actually produce sound if it
//   // was created/resumed during a genuine user gesture (a click/tap). A
//   // context created inside a background timer (our polling interval)
//   // starts permanently suspended and stays silent. This listens for the
//   // admin's very first click anywhere on the page and uses it to unlock
//   // the shared audio context, so background polls can use it later.
//   useEffect(() => {
//     const handleFirstClick = () => {
//       unlockAudio();
//       document.removeEventListener("click", handleFirstClick);
//     };
//     document.addEventListener("click", handleFirstClick);
//     return () => document.removeEventListener("click", handleFirstClick);
//   }, []);

//   // ── Keep the screen awake while this page is open ──────────────────
//   // So a counter tablet/laptop doesn't auto-lock and miss new-order sounds.
//   useEffect(() => {
//     let wakeLock = null;
//     const requestWakeLock = async () => {
//       try {
//         if ("wakeLock" in navigator) {
//           wakeLock = await navigator.wakeLock.request("screen");
//         }
//       } catch {
//         // not supported on this browser/device — fails silently, no harm done
//       }
//     };
//     requestWakeLock();

//     // the wake lock is automatically released when a tab loses visibility —
//     // re-acquire it once the tab becomes visible again
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === "visible") requestWakeLock();
//     };
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//       wakeLock?.release().catch(() => {});
//     };
//   }, []);

//   // ── Background polling — checks for new orders every 10 seconds ────
//   useEffect(() => {
//     const interval = setInterval(fetchOrders, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   // ── Data fetching ────────────────────────────────────────────────────

//   const fetchAll = async () => {
//     try {
//       const [ordersData, restaurantData] = await Promise.all([
//         getOrdersApi(),
//         getMyRestaurantApi(),
//       ]);
//       const initialOrders = ordersData.orders || [];
//       knownOrderIdsRef.current = new Set(initialOrders.map((o) => o._id)); // seed baseline so first poll doesn't false-positive
//       setOrders(initialOrders);
//       setRestaurant(restaurantData.restaurant);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOrders = async () => {
//     const fetchId = ++latestFetchIdRef.current; // this fetch's unique sequence number

//     try {
//       const data = await getOrdersApi();

//       // if a newer fetch has started since this one began, a slower/older
//       // request finishing later must never overwrite fresher data — ignore
//       if (fetchId !== latestFetchIdRef.current) return;

//       const newOrders = data.orders || [];

//       // only run new-order detection once we have a real baseline —
//       // skip it on the very first call so existing orders aren't flagged as "new"
//       if (knownOrderIdsRef.current.size > 0) {
//         const newlyArrived = newOrders.filter(
//           (o) => !knownOrderIdsRef.current.has(o._id),
//         );
//         if (newlyArrived.length > 0) {
//           // sound only plays for Pro restaurants, and only if the toggle
//           // in Settings hasn't been switched off — the visual toast below
//           // still shows either way. Reading restaurantIsProRef.current
//           // (not the plain restaurantIsPro variable) is what makes this
//           // correctly reflect Pro status even from inside this long-lived
//           // polling function — see the comment on restaurantIsProRef above.
//           if (restaurantIsProRef.current && isNotificationSoundEnabled()) {
//             playSound(getSelectedSound());
//           }

//           toast.custom(
//             (t) => (
//               <div className="bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
//                 ⓘ {newlyArrived.length} new order!
//                 {newlyArrived.length > 1 ? "s" : ""}
//               </div>
//             ),
//             { duration: 2000, position: "top-center" },
//           );
//         }
//       }

//       knownOrderIdsRef.current = new Set(newOrders.map((o) => o._id));
//       setOrders(newOrders);
//     } catch {
//       // silent — this runs every 10s in the background, a stray failure
//       // shouldn't interrupt the admin with an error toast
//     }
//   };

//   // ── Order actions ────────────────────────────────────────────────────

//   const handleAccept = async (id) => {
//     if (processingId) return; // guard against double-clicks
//     setProcessingId(id);
//     try {
//       const data = await acceptOrderApi(id);
//       setOrders((p) => p.map((o) => (o._id === id ? data.order : o)));
//       toast.success("Order accepted");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed");
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handlePrintDone = async (order) => {
//     try {
//       const data = await markSlipPrintedApi(order._id);
//       setOrders((p) => p.map((o) => (o._id === order._id ? data.order : o)));
//       setSlipOrderId(null);
//       toast.success("Started preparing");
//     } catch {
//       toast.error("Failed to update");
//     }
//   };

//   const handleStatusUpdate = async (orderId, nextStatus) => {
//     if (processingId) return; // guard against double-clicks
//     setProcessingId(orderId);
//     try {
//       const data = await updateOrderStatusApi(orderId, nextStatus);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       toast.success(`Marked as ${nextStatus}`);
//     } catch {
//       toast.error("Failed to update");
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handleConfirmCash = async (orderId) => {
//     if (processingId) return; // guard against double-clicks
//     setProcessingId(orderId);
//     try {
//       const data = await confirmCashPaymentApi(orderId);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       toast.success("Cash payment confirmed");
//     } catch {
//       toast.error("Failed to confirm");
//     } finally {
//       setProcessingId(null);
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

//   // ── Filtering ────────────────────────────────────────────────────────

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

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-slate-400 text-sm animate-pulse">
//           Loading orders...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-5">
//       {slipOrder && (
//         <KitchenSlip
//           order={slipOrder}
//           onClose={() => setSlipOrderId(null)}
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
//         <button
//           onClick={fetchOrders}
//           className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 active:translate-y-0.5 active:shadow-inner transition-all duration-100 ease-out text-slate-300 text-sm font-semibold cursor-pointer"
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
//             const isThisOrderProcessing = processingId === order._id; // is THIS specific order mid-action

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
//                       {order.customerId?.username || "Guest"}
//                       {order.customerId?.phone && (
//                         <span className="text-slate-500">
//                           {" "}
//                           · {order.customerId.phone.replace(/^\+?91/, "")}
//                         </span>
//                       )}{" "}
//                       ·{" "}
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
//                     </div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg px-3 py-2">
//                     <div className="text-slate-500">
//                       CGST+SGST ({order.gstPercent}%)
//                     </div>
//                     <div className="text-slate-300 font-semibold">
//                       ₹{order.gstAmount.toFixed(2)}
//                     </div>
//                   </div>
//                   <div className="bg-white/5 rounded-lg px-3 py-2">
//                     <div className="text-slate-500">Total</div>
//                     <div className="text-white font-bold">
//                       ₹{order.totalAmount.toFixed(2)}
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
//                           disabled={isThisOrderProcessing}
//                           className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           {isThisOrderProcessing ? "Accepting..." : "Accept"}
//                         </button>
//                         <button
//                           onClick={() => setCancelModal(order)}
//                           disabled={isThisOrderProcessing}
//                           className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           Cancel
//                         </button>
//                       </>
//                     )}
//                     {order.status === "Accepted" && (
//                       <button
//                         onClick={() => setSlipOrderId(order._id)}
//                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
//                       >
//                         <svg
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2"
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           className="w-3.5 h-3.5 shrink-0"
//                         >
//                           <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16a2 2 0 012 2v6h-4M2 17v-6a2 2 0 012-2" />
//                         </svg>
//                         <span>Print &amp; Send to Kitchen</span>
//                       </button>
//                     )}
//                     {order.status === "Preparing" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Ready")}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing ? "Updating..." : "Mark Ready"}
//                       </button>
//                     )}
//                     {order.status === "Ready" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Served")}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing ? "Updating..." : "Mark Served"}
//                       </button>
//                     )}
//                     {isCashPending && (
//                       <button
//                         onClick={() => handleConfirmCash(order._id)}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing
//                           ? "Confirming..."
//                           : "₹ Confirm Cash Received"}
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

// // import { isNotificationSoundEnabled } from "../../utils/notificationPrefs";
// import { isNotificationSoundEnabled, getSelectedSound } from "../../utils/notificationPrefs";
// // import { playSound } from "../../utils/notificationSounds";
// import { playSound, unlockAudio } from "../../utils/notificationSounds";

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

// // new for notification sound
// // Generates a short, pleasant two-tone alert beep using the Web Audio API —
// // no external audio file needed, works identically in every browser.
// const playNotificationSound = () => {
//   try {
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     const playTone = (freq, startTime, duration) => {
//       const osc = ctx.createOscillator();
//       const gain = ctx.createGain();
//       osc.connect(gain);
//       gain.connect(ctx.destination);
//       osc.type = "sine";
//       osc.frequency.value = freq;
//       gain.gain.setValueAtTime(0.3, startTime);
//       gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
//       osc.start(startTime);
//       osc.stop(startTime + duration);
//     };
//     const now = ctx.currentTime;
//     playTone(880, now, 0.15); // first, higher note
//     playTone(660, now + 0.15, 0.2); // second, lower note
//   } catch {
//     // Web Audio API unsupported or blocked — fails silently, toast still shows
//   }
// };

// export default function Orders() {
//   const latestFetchIdRef = useRef(0); // ← add this alongside your other refs

//   const [orders, setOrders] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [statusFilter, setStatusFilter] = useState("all");
//   // const [dateMode, setDateMode] = useState("all"); // "all" | "pick"
//   const [dateMode, setDateMode] = useState("pick"); // "all" | "pick"
//   const [pickedDate, setPickedDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );
//   const datePickerRef = useRef(null);
//   const [loading, setLoading] = useState(true);

//   // const [slipOrder, setSlipOrder] = useState(null);
//   const [slipOrderId, setSlipOrderId] = useState(null); // ← replaces slipOrder as raw state
//   // ← derived fresh on every render — always reflects the latest data for
//   // this order ID, automatically, whenever `orders` updates from a poll
//   const slipOrder = orders.find((o) => o._id === slipOrderId) || null;

//   const [cancelModal, setCancelModal] = useState(null);
//   const [cancelReason, setCancelReason] = useState("");
//   const [cancelling, setCancelling] = useState(false);
//   const [processingId, setProcessingId] = useState(null); // ← tracks which order is mid-action (Accept/Ready/Served/Confirm Cash)
//   const knownOrderIdsRef = useRef(new Set()); // ← tracks which order IDs we've already seen, for new-order detection
//   // useEffect(() => {
//   //   fetchAll();
//   //   const interval = setInterval(fetchOrders, 10000);
//   //   return () => clearInterval(interval);
//   // }, []);
//   const hasFetchedRef = useRef(false);

//   useEffect(() => {
//     if (hasFetchedRef.current) return;
//     hasFetchedRef.current = true;
//     fetchAll(); // ← your initial fetch function
//   }, []);

//   // ← unlocks the shared audio context the moment the admin clicks anywhere
// // on this page — a real user gesture, which is what lets background polls
// // actually produce sound later, instead of the context staying suspended
// useEffect(() => {
//   const handleFirstClick = () => {
//     unlockAudio();
//     document.removeEventListener("click", handleFirstClick);
//   };
//   document.addEventListener("click", handleFirstClick);
//   return () => document.removeEventListener("click", handleFirstClick);
// }, []);

//   // new for notification sound
//   // ← keeps the screen from sleeping while this page is open, so a counter
//   // tablet/laptop stays awake and able to play the notification sound
//   useEffect(() => {
//     let wakeLock = null;
//     const requestWakeLock = async () => {
//       try {
//         if ("wakeLock" in navigator) {
//           wakeLock = await navigator.wakeLock.request("screen");
//         }
//       } catch {
//         // not supported on this browser/device — fails silently, no harm done
//       }
//     };
//     requestWakeLock();

//     // re-acquire if the tab becomes visible again after being backgrounded,
//     // since the wake lock is automatically released when a tab loses visibility
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === "visible") requestWakeLock();
//     };
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//       wakeLock?.release().catch(() => {});
//     };
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(fetchOrders, 10000); // ← leave this one exactly as-is, no guard needed
//     return () => clearInterval(interval);
//   }, []);

//   const fetchAll = async () => {
//     try {
//       const [ordersData, restaurantData] = await Promise.all([
//         getOrdersApi(),
//         getMyRestaurantApi(),
//       ]);
//       const initialOrders = ordersData.orders || [];
//       knownOrderIdsRef.current = new Set(initialOrders.map((o) => o._id)); // ← seed baseline so first poll doesn't false-positive
//       setOrders(initialOrders);
//       setRestaurant(restaurantData.restaurant);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOrders = async () => {
//     const fetchId = ++latestFetchIdRef.current; // ← this fetch's unique sequence number

//     try {
//       const data = await getOrdersApi();
//       // ← THE FIX: if a newer fetch has started since this one began, a
//       // slower/older request finishing later must never overwrite fresher
//       // data that already arrived — ignore this result entirely.
//       if (fetchId !== latestFetchIdRef.current) return;

//       const newOrders = data.orders || [];

//       // only run new-order detection once we have a real baseline —
//       // skip it on the very first call so existing orders aren't flagged as "new"
//       if (knownOrderIdsRef.current.size > 0) {
//         const newlyArrived = newOrders.filter(
//           (o) => !knownOrderIdsRef.current.has(o._id),
//         );
//         if (newlyArrived.length > 0) {
//           // ← new: sound only plays for Pro restaurants, and only if the toggle in
//           // Settings hasn't been switched off — the visual toast still shows either way
//           // if (restaurantIsPro && isNotificationSoundEnabled()) playNotificationSound();

//           // new
//             console.log("🔊 New order detected. restaurantIsPro:", restaurantIsPro, "| soundEnabled:", isNotificationSoundEnabled(), "| selectedSound:", getSelectedSound());

//           if (restaurantIsPro && isNotificationSoundEnabled()) playSound(getSelectedSound());

//           toast.custom(
//             (t) => (
//               <div className="bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
//                 ⓘ {newlyArrived.length} new order!
//                 {newlyArrived.length > 1 ? "s" : ""}
//               </div>
//             ),
//             { duration: 2000, position: "top-center" },
//           );
//         }
//       }

//       knownOrderIdsRef.current = new Set(newOrders.map((o) => o._id));
//       setOrders(newOrders);
//     } catch {}
//   };
//   const handleAccept = async (id) => {
//     if (processingId) return; // ← guard against double-clicks
//     setProcessingId(id);
//     try {
//       const data = await acceptOrderApi(id);
//       setOrders((p) => p.map((o) => (o._id === id ? data.order : o)));
//       toast.success("Order accepted");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed");
//     } finally {
//       setProcessingId(null);
//     }
//   };
//   const handlePrintDone = async (order) => {
//     try {
//       const data = await markSlipPrintedApi(order._id);
//       setOrders((p) => p.map((o) => (o._id === order._id ? data.order : o)));
//       setSlipOrder(null);
//       // toast.success("Slip printed — sent to kitchen 👨‍🍳");
//       toast.success("Started preparing");
//     } catch {
//       toast.error("Failed to update");
//     }
//   };
//   const handleStatusUpdate = async (orderId, nextStatus) => {
//     if (processingId) return; // ← guard against double-clicks
//     setProcessingId(orderId);
//     try {
//       const data = await updateOrderStatusApi(orderId, nextStatus);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       toast.success(`Marked as ${nextStatus}`);
//     } catch {
//       toast.error("Failed to update");
//     } finally {
//       setProcessingId(null);
//     }
//   };
//   const handleConfirmCash = async (orderId) => {
//     if (processingId) return; // ← guard against double-clicks
//     setProcessingId(orderId);
//     try {
//       const data = await confirmCashPaymentApi(orderId);
//       setOrders((p) => p.map((o) => (o._id === orderId ? data.order : o)));
//       // toast.success("Cash payment confirmed ✅ Order completed");
//       toast.success("Cash payment confirmed");
//     } catch {
//       toast.error("Failed to confirm");
//     } finally {
//       setProcessingId(null);
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

//   const restaurantIsPro = restaurant?.subscriptionPlan === "pro"; // ← new

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
//           // onClose={() => setSlipOrder(null)}
//           onClose={() => setSlipOrderId(null)}
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
//           onClick={fetchOrders}
//           className="
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
//       )}{" "}
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
//             {/* 📅{" "} */}{" "}
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
//             const isThisOrderProcessing = processingId === order._id; // ← is THIS specific order mid-action
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

//                     {/* <div className="text-slate-400 text-xs mt-0.5">
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
//                     </div> */}

//                     <div className="text-slate-400 text-xs mt-0.5">
//                       {order.customerId?.username || "Guest"}
//                       {order.customerId?.phone && (
//                         // <span className="text-slate-500"> · {order.customerId.phone}</span>
//                         <span className="text-slate-500">
//                           {" "}
//                           · {order.customerId.phone.replace(/^\+?91/, "")}
//                         </span>
//                       )}{" "}
//                       ·{" "}
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
//                           disabled={isThisOrderProcessing}
//                           className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           {isThisOrderProcessing ? "Accepting..." : "Accept"}
//                         </button>
//                         <button
//                           onClick={() => setCancelModal(order)}
//                           disabled={isThisOrderProcessing}
//                           className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                           Cancel
//                         </button>
//                       </>
//                     )}
//                     {order.status === "Accepted" && (
//                       <button
//                         // onClick={() => setSlipOrder(order)}
//                         onClick={() => setSlipOrderId(order._id)}
//                         // className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
//                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
//                       >
//                         <svg
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2"
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           className="w-3.5 h-3.5 shrink-0"
//                         >
//                           <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16a2 2 0 012 2v6h-4M2 17v-6a2 2 0 012-2" />
//                         </svg>
//                         <span>Print &amp; Send to Kitchen</span>
//                         {/* Print & Send to Kitchen */}
//                         {/* 🖨️ Print & Send to Kitchen */}
//                       </button>
//                     )}
//                     {order.status === "Preparing" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Ready")}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing ? "Updating..." : "Mark Ready"}
//                       </button>
//                     )}
//                     {order.status === "Ready" && (
//                       <button
//                         onClick={() => handleStatusUpdate(order._id, "Served")}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing ? "Updating..." : "Mark Served"}
//                       </button>
//                     )}
//                     {isCashPending && (
//                       <button
//                         onClick={() => handleConfirmCash(order._id)}
//                         disabled={isThisOrderProcessing}
//                         className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {isThisOrderProcessing
//                           ? "Confirming..."
//                           : "₹ Confirm Cash Received"}
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
