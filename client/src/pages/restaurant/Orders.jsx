// after kiosk
import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  acceptOrderApi,
  markSlipPrintedApi,
  acceptAndPrintApi,
  updateOrderStatusApi,
  cancelOrderApi,
  confirmCashPaymentApi,
} from "../../api/orderApi";
import { getMyRestaurantApi } from "../../api/restaurantApi";
import KitchenSlip from "../../components/admin/KitchenSlip";
import toast from "react-hot-toast";
import { useOrders } from "../../context/OrdersContext";
import { RefreshCw, TriangleAlert } from "lucide-react";

// Local-date helper: toISOString() reports the date in UTC, which for IST
// (UTC+5:30) is still "yesterday" for the first 5.5 hours after midnight.
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-600",
  Accepted: "bg-violet-50 text-violet-600",
  Preparing: "bg-blue-50 text-blue-600",
  Ready: "bg-blue-50 text-blue-600", // legacy — no longer created
  Served: "bg-green-50 text-green-600",
  Completed: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-50 text-red-600",
};

// Order flow: Pending → Accepted → Preparing → Served → Completed.
const BASE_STATUSES = ["Pending", "Accepted", "Preparing", "Served", "Completed", "Cancelled"];

const CANCEL_QUICK_REASONS = ["Item unavailable", "Kitchen is closed", "Customer request"];

export default function Orders() {
  // Live order data comes from the shared context (socket + refetch handled
  // at the layout level, so it stays current on every admin page).
  const { orders, loading, updateOrderInList, refetchOrders } = useOrders();

  // shared ["restaurant"] cache — gives us the owner's token limit
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await getMyRestaurantApi()).restaurant,
    retry: false,
  });
  const tokenLimit = restaurant?.tokenLimit ?? 100;

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateMode, setDateMode] = useState("pick"); // "pick" | "all" — defaults to Today
  const [pickedDate, setPickedDate] = useState(getLocalDateString());
  const datePickerRef = useRef(null);

  // Bill preview modal — derived fresh from `orders` every render so it
  // always shows the latest data for that order
  const [slipOrderId, setSlipOrderId] = useState(null);
  const slipOrder = orders.find((o) => o._id === slipOrderId) || null;

  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [processingId, setProcessingId] = useState(null); // which order is mid-action

  // ── actions ──────────────────────────────────────────────────────────
  // "Accept" calls the API (Pending → Accepted) then opens the bill slip.
  // "Print Bill" calls markSlipPrinted (Accepted → Preparing).
  const handleAccept = async (order) => {
    try {
      const data = await acceptOrderApi(order._id);
      updateOrderInList(order._id, data.order);
      setSlipOrderId(order._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept order");
    }
  };

  // Print Bill moves order Accepted → Preparing immediately for the admin.
  // Customer side shows "Accepted" for 2 min before showing "Preparing".
  const handlePrintDone = async (order) => {
    try {
      const data = await markSlipPrintedApi(order._id);
      updateOrderInList(order._id, data.order);
      setSlipOrderId(null);
      toast.success(data.order.tokenNumber != null ? `Token #${data.order.tokenNumber} sent to kitchen` : "Sent to kitchen");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    }
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    if (processingId) return;
    setProcessingId(orderId);
    try {
      const data = await updateOrderStatusApi(orderId, nextStatus);
      updateOrderInList(orderId, data.order);
      toast.success(`Marked as ${nextStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
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

  // ── filtering ────────────────────────────────────────────────────────
  const isOrderInDateFilter = (order) => {
    if (dateMode === "all") return true;
    const orderDate = new Date(order.createdAt);
    const d = new Date(pickedDate);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return orderDate >= d && orderDate < next;
  };

  const filtered = useMemo(
    () => orders.filter((o) => (statusFilter === "all" || o.status === statusFilter) && isOrderInDateFilter(o)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, statusFilter, dateMode, pickedDate],
  );

  const periodRevenue = filtered
    .filter((o) => o.status === "Completed" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  // const pendingCount = orders.filter((o) => o.status === "Pending").length;
  // new
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const pendingCount = pendingOrders.length;

  const cashPendingOrders = orders.filter(
    (o) => o.paymentMethod === "cash" && o.paymentStatus !== "paid" && o.status === "Served",
  );

  // new
  // Jump to a banner's orders using the smallest date range that shows them all:
  // only today's orders → "Today"; anything older (or a mix) → "All Time".
  const showBannerOrders = (list, status) => {
    const now = new Date();
    const isTodayOrder = (o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    setStatusFilter(status);
    if (list.every(isTodayOrder)) {
      setPickedDate(getLocalDateString());
      setDateMode("pick");
    } else {
      setDateMode("all");
    }
  };


  // tokens currently held by live orders; if they've outgrown the limit the
  // owner gets a heads-up (customers are never turned away)
  const liveTokenCount = orders.filter((o) => o.tokenActive).length;
  const overLimitCount = orders.filter((o) => o.tokenActive && o.tokenNumber > tokenLimit).length;

  const statuses = [
    "all",
    ...BASE_STATUSES,
    ...(orders.some((o) => o.status === "Ready") ? ["Ready"] : []),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm animate-pulse">Loading orders...</div>
      </div>
    );
  }

  const chip = (active) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      active ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
    }`;

  return (
    <div className="space-y-5">
      {slipOrder && (
        <KitchenSlip order={slipOrder} onClose={() => setSlipOrderId(null)} onPrinted={() => handlePrintDone(slipOrder)} />
      )}

      {/* ── cancel modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="font-display text-gray-900 font-semibold text-xl">Cancel order?</h3>
              <p className="text-gray-600 text-xs mt-1">
                Token #{cancelModal.tokenNumber ?? "-"} will be freed. The customer will see your reason.
              </p>
            </div>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (shown to the customer)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-5">
              {CANCEL_QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 text-gray-600 text-xs font-medium hover:border-blue-600"
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
                className="flex-1 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100"
              >
                Keep order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-500 hover:opacity-90 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-gray-900 font-semibold text-3xl">Orders</h2>
          <p className="text-gray-600 text-sm mt-1">
            {filtered.length} orders · Revenue: ₹{periodRevenue.toLocaleString()}
          </p>
        </div>
        <button
          onClick={refetchOrders}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 active:scale-95 transition-all text-gray-900 text-sm font-semibold cursor-pointer"
        >
          <RefreshCw size={15} strokeWidth={2.5} />
          Refresh
        </button>
      </div>

      {/* ── banners ── */}
      {overLimitCount > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <TriangleAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="text-amber-600 font-semibold">
              All {tokenLimit} tokens are in use — {overLimitCount} order{overLimitCount > 1 ? "s are" : " is"} running past the limit
            </div>
            <div className="text-gray-600 text-xs mt-0.5">
              Customers still get their order (tokens #{tokenLimit + 1}, #{tokenLimit + 2}…). You can raise the limit in Settings.
            </div>
          </div>
        </div>
      )}

      {overLimitCount === 0 && liveTokenCount >= tokenLimit && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-600 font-semibold">
          All {tokenLimit} tokens are in use — the next order will get #{tokenLimit + 1}.
        </div>
      )}

      {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-50/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {pendingCount}
            </div>
            <span className="text-gray-900 font-medium text-sm">
              new order{pendingCount > 1 ? "s" : ""} waiting
            </span>
          </div>
          <button
            // onClick={() => {
            //   setStatusFilter("Pending");
            //   setDateMode("all"); // so the banner's count and the visible list always match
            // }}

            // new
            onClick={() => 
              showBannerOrders(pendingOrders, "Pending")
            }

            className="text-amber-600 text-xs font-semibold"
          >
            View →
          </button>
        </div>
      )}

      {cashPendingOrders.length > 0 && (
        <div className="rounded-2xl border border-green-500/25 bg-green-50/70 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {cashPendingOrders.length}
            </div>
            <span className="text-gray-900 font-medium text-sm">
              cash payment{cashPendingOrders.length > 1 ? "s" : ""} waiting confirmation
            </span>
          </div>
          <button
            // onClick={() => {
            //   setStatusFilter("Served");
            //   setDateMode("all");
            // }}

            // new
            onClick={() => 
              showBannerOrders(cashPendingOrders, "Served")
            }

            className="text-green-600 text-xs font-semibold"
          >
            View →
          </button>
        </div>
      )}

      {/* ── date filter ── */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDateMode("pick");
              requestAnimationFrame(() => datePickerRef.current?.showPicker?.());
            }}
            className={chip(dateMode === "pick")}
          >
            {pickedDate === getLocalDateString()
              ? "Today"
              : new Date(pickedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
        <button onClick={() => setDateMode("all")} className={chip(dateMode === "all")}>
          All Time
        </button>
      </div>

      {/* ── status filter ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {statuses.map((f) => {
          const n = f === "all" ? 0 : orders.filter((o) => o.status === f && isOrderInDateFilter(o)).length;
          return (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === f ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "All Status" : f}
              {n > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full ${statusFilter === f ? "bg-white/20" : "bg-gray-100"}`}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {orders.some((o) => o.status === "Ready") && (
        <p className="text-gray-400 text-xs">
          Some older orders are still in the previous Ready stage — they can be sent on from here too.
        </p>
      )}

      {/* ── order list ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-600">
          <div className="font-semibold">No orders found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isCancelled = order.status === "Cancelled";
            const isCompleted = order.status === "Completed";
            const isCashPending =
              order.paymentMethod === "cash" && order.paymentStatus !== "paid" && order.status === "Served";
            const busy = processingId === order._id;
            const overLimit = order.tokenActive && order.tokenNumber > tokenLimit;
            // Accept & Print buttons are shown separately per status below

            const edge = isCancelled
              ? "border-red-500/25 bg-red-50/40 opacity-80"
              : order.status === "Pending"
                ? "border-gray-200 bg-white"
                : order.status === "Accepted"
                  ? "border-gray-200 bg-white"
                  : isCashPending
                    ? "border-gray-200 bg-white"
                    : "border-gray-200 bg-white";


            // const edge = isCancelled
            //   ? "border-red-500/25 bg-red-50/40 opacity-80"
            //   : order.status === "Pending"
            //     ? "border-amber-500/40 bg-white"
            //     : order.status === "Accepted"
            //       ? "border-violet-500/40 bg-white"
            //       : isCashPending
            //         ? "border-green-500/40 bg-white"
            //         : "border-gray-200 bg-white";

            return (
              <div key={order._id} className={`rounded-2xl border p-5 transition-all ${edge}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* token */}
                    <div
                      className={`shrink-0 rounded-xl px-3 py-2 text-center ${
                        order.tokenNumber == null ? "bg-gray-100 text-gray-400" : overLimit ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-widest leading-none">Token</div>
                      <div className="font-mono font-bold text-xl leading-tight mt-0.5">
                        {order.tokenNumber != null ? `#${order.tokenNumber}` : "—"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-bold text-base">{order.tableId?.name || "Unknown"}</span>
                        <span className="text-gray-400 text-xs font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                        {overLimit && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">OVER LIMIT</span>
                        )}
                      </div>
                      <div className="text-gray-600 text-xs mt-0.5">
                        {/* {order.customerId?.username || "Guest"} */}

                        {/* new */}
                        {/* {order.customerId?.username || order.guestName || "Guest"}

                        {order.customerId?.phone && (
                          <span className="text-gray-400"> · {order.customerId.phone.replace(/^\+?91/, "")}</span> */}

                        {/* new */}
                        {order.customerId?.username || order.guestName || "Guest"}
                        {(order.customerId?.phone || order.guestPhone) && (
                          <span className="text-gray-400"> · {(order.customerId?.phone || order.guestPhone).replace(/^\+?91/, "")}</span>
                        

                        )}{" "}
                        · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>
                    {order.status}
                  </span>
                </div>

                {isCancelled && order.cancellationReason && (
                  <div className="bg-red-50 rounded-xl px-3 py-2 mb-3 text-red-600 text-xs">
                    <span className="font-bold">Reason: </span>
                    {order.cancellationReason}
                  </div>
                )}

                <div className={`space-y-1.5 mb-3 rounded-xl p-3 bg-gray-50 border border-gray-200 ${isCancelled ? "opacity-50" : ""}`}>
                  {order.items.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center ${isCancelled ? "line-through" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-sm border ${item.isVeg ? "border-green-500" : "border-red-500"} flex items-center justify-center`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                        </span>
                        <span className="text-gray-900 text-sm">
                          {item.name}
                          {item.portion && (
                            <span className="text-gray-600 text-xs"> ({item.portion === "half" ? "Half" : "Full"})</span>
                          )}
                        </span>
                        <span className="text-gray-600 text-xs">× {item.qty}</span>
                      </div>
                      <span className="text-gray-900 text-sm font-semibold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                {/* <div className="grid grid-cols-3 gap-2 mb-3 text-xs"> */}
                {/* new */}
                <div className={`grid ${Number(order.gstPercent) > 0 ? "grid-cols-3" : "grid-cols-1"} gap-2 mb-3 text-xs`}>


                  {Number(order.gstPercent) > 0 && (
                    <>
                      {/* Subtotal cell */}
                      {/* CGST+SGST cell */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div className="text-gray-400">Subtotal</div>
                    <div className="text-gray-900 font-semibold">₹{order.subtotal.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div className="text-gray-400">CGST+SGST ({order.gstPercent}%)</div>
                    <div className="text-gray-900 font-semibold">₹{order.gstAmount.toFixed(2)}</div>
                  </div>
                    </>
                  )}



                  





                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div className="text-gray-400">Total</div>
                    <div className="text-gray-900 font-bold">₹{order.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
                  {isCompleted ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                      ✓ Paid · {order.paymentMethod === "online" ? "Online" : "Cash"}
                    </span>
                  ) : isCancelled ? (
                    <span className="text-red-600 text-xs font-bold">Cancelled</span>
                  ) : order.paymentStatus === "paid" ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">Paid online</span>
                  ) : (
                    <span />
                  )}

                  <div className="flex gap-2 flex-wrap justify-end">
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleAccept(order)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === "Accepted" && (
                      <button
                        onClick={() => setSlipOrderId(order._id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        Print & Send to Kitchen
                      </button>
                    )}
                    {(order.status === "Pending" || order.status === "Accepted") && (
                      <button
                        onClick={() => setCancelModal(order)}
                        disabled={busy}
                        className="px-3 py-2 border border-red-500/30 bg-red-50 text-red-600 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    {(order.status === "Preparing" || order.status === "Ready") && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "Served")}
                        disabled={busy}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        {busy ? "Updating..." : "Mark Served"}
                      </button>
                    )}
                    {isCashPending && (
                      <button
                        onClick={() => handleConfirmCash(order._id)}
                        disabled={busy}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        {busy ? "Confirming..." : "Confirm Cash Received"}
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
