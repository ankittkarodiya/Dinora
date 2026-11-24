// light theme
import { useState, useEffect } from "react";
import { getSessionOrdersApi } from "../../api/publicApi";
import VegIcon from "../common/VegIcon";
import { RefreshCw } from "lucide-react";

const STATUS_STEPS = ["Pending", "Accepted", "Preparing", "Served"];

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-600",
  Accepted: "bg-violet-50 text-violet-600",
  Preparing: "bg-blue-50 text-blue-600",
  Served: "bg-green-50 text-green-600",
  Completed: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-50 text-red-600",
};

// All cards are plain white — only the status pill text color changes
const CARD_CLASS = "border-gray-200 bg-white";
const CARD_CLASS_CANCELLED = "border-gray-200 bg-white opacity-80";

const STATUS_DESC = {
  Pending: "Your order has been placed",
  Accepted: "Restaurant has accepted your order",
  Preparing: "Kitchen is cooking your food",
  Served: "Enjoy your meal!",
  Completed: "Thank you for dining with us!",
  Cancelled: "This order was cancelled",
};

function StatusBar({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 mb-4">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0
              ${isDone ? "bg-accent border-accent text-white" : ""}
              ${isCurrent ? "bg-accent-soft border-accent text-accent" : ""}
              ${!isDone && !isCurrent ? "bg-page border-line text-faint" : ""}
            `}
            >
              {isDone ? "✓" : i + 1}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${isDone ? "bg-accent" : "bg-line"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Customer sees "Accepted" for at least 2 minutes after the restaurant
// accepts the order — even if the admin already printed the bill and
// moved it to Preparing in the DB. After 2 min from acceptedAt, the
// real status shows through.
const ACCEPTED_DISPLAY_MS = 2 * 60 * 1000; // 2 minutes

const getDisplayStatus = (order) => {
  if (
    order.status === "Preparing" &&
    // order.acceptedAt

    // new
    order.slipPrintedAt

  ) {
    // const elapsed = Date.now() - new Date(order.acceptedAt).getTime();

    // new
    const elapsed = Date.now() - new Date(order.slipPrintedAt).getTime();

    if (elapsed < ACCEPTED_DISPLAY_MS) return "Accepted";
  }
  return order.status;
};

export default function OrderTracker({ sessionId, isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0); // for re-render when 2-min timer expires

  const fetchOrders = async () => {
    if (!sessionId) return;
    try {
      const data = await getSessionOrdersApi(sessionId);
      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId]);

  // When an order is "Preparing" but still inside the 2-min Accepted
  // display window, schedule a re-render so the UI flips on time.
  useEffect(() => {
    const timers = [];
    orders.forEach((order) => {
      // if (order.status === "Preparing" && order.acceptedAt) {
      //   const remaining =
      //     ACCEPTED_DISPLAY_MS - (Date.now() - new Date(order.acceptedAt).getTime());

      // new
      if (order.status === "Preparing" && order.slipPrintedAt) {
        const remaining =
          ACCEPTED_DISPLAY_MS - (Date.now() - new Date(order.slipPrintedAt).getTime());


        if (remaining > 0) {
          timers.push(setTimeout(() => forceUpdate((n) => n + 1), remaining + 100));
        }
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [orders]);

  const runningTotal = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + o.totalAmount, 0);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-ink/40 z-100 flex items-end justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-surface border-t border-line rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
      >
        {/* Handle + header */}
        <div className="px-5 pt-4 pb-3 border-b border-line shrink-0">
          <div className="w-10 h-1 bg-line rounded-full mx-auto mb-4" />
          <div className="flex justify-between items-center">
            <div>
              <div className="font-display text-ink font-semibold text-lg">Order Tracker</div>
              <div className="text-faint text-xs mt-0.5">
                Auto-refreshes every 10 seconds
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                  bg-accent-soft border border-accent/20
                  text-accent text-xs font-semibold
                  hover:bg-accent/15 active:scale-95 transition-all"
              >
                <RefreshCw size={14} strokeWidth={2.5} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-page border border-line text-muted hover:bg-surface text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-muted">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-line border-t-accent animate-spin" />
              <div>Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <div className="font-semibold text-ink">No orders yet</div>
              <div className="text-sm mt-1">Place an order from the menu</div>
            </div>
          ) : (
            <>
              {orders.map((order) => {
                const displayStatus = getDisplayStatus(order);
                const isCancelled = displayStatus === "Cancelled";
                const edge = isCancelled ? CARD_CLASS_CANCELLED : CARD_CLASS;

                return (
                  <div
                    key={order._id}
                    className={`rounded-2xl border p-5 transition-all ${edge}`}
                  >
                    {/* Token box + info + status pill */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`shrink-0 rounded-xl px-3 py-2 text-center ${
                            order.tokenNumber == null
                              ? "bg-gray-100 text-gray-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase tracking-widest leading-none">Token</div>
                          <div className="font-mono font-bold text-xl leading-tight mt-0.5">
                            {order.tokenNumber != null ? `#${order.tokenNumber}` : "—"}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gray-900 font-bold text-base">
                              {order.tableId?.name || "Table"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at{" "}
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[displayStatus] || STATUS_STYLE.Pending}`}>
                        {displayStatus}
                      </span>
                    </div>

                    {/* Status bar — only for active orders */}
                    {!isCancelled && displayStatus !== "Completed" && (
                      <StatusBar status={displayStatus} />
                    )}

                    {/* Status description */}
                    <div className={`text-xs font-semibold mb-3 ${(STATUS_STYLE[displayStatus] || "").split(" ").find(c => c.startsWith("text-")) || "text-gray-600"}`}>
                      {STATUS_DESC[displayStatus] || ""}
                    </div>

                    {/* Cancellation reason */}
                    {isCancelled && order.cancellationReason && (
                      <div className="bg-red-50 rounded-xl px-3 py-2 mb-3 text-red-600 text-xs">
                        <span className="font-bold">Reason: </span>
                        {order.cancellationReason}
                      </div>
                    )}

                    {/* Items in gray box */}
                    <div className={`space-y-1.5 mb-3 rounded-xl p-3 bg-gray-50 border border-gray-200 ${isCancelled ? "opacity-50" : ""}`}>
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className={`flex justify-between items-center ${isCancelled ? "line-through" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <VegIcon isVeg={item.isVeg} />
                            <span className="text-gray-900 text-sm">
                              {item.name}
                              {item.portion && (
                                <span className="text-gray-600 text-xs"> ({item.portion === "half" ? "Half" : "Full"})</span>
                              )}
                            </span>
                            <span className="text-gray-600 text-xs">× {item.qty}</span>
                          </div>
                          <span className="text-gray-900 text-sm font-semibold">
                            ₹{item.price * item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal / GST / Total grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">Subtotal</div>
                        <div className="text-gray-900 font-semibold">₹{(order.subtotal ?? order.totalAmount ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">CGST+SGST{order.gstPercent ? ` (${order.gstPercent}%)` : ""}</div>
                        <div className="text-gray-900 font-semibold">₹{(order.gstAmount ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">Total</div>
                        <div className="text-gray-900 font-bold">₹{(order.totalAmount ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Footer — payment status */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-500 text-xs">
                        {isCancelled
                          ? "Cancelled"
                          : order.paymentStatus === "paid"
                            ? "✓ Paid"
                            : "Payment pending"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Running total */}
              {orders.filter((o) => o.status !== "Cancelled").length > 1 && (
                <div className="rounded-2xl border border-line bg-surface p-4 flex justify-between items-center">
                  <div>
                    <div className="text-ink font-bold">Running Total</div>
                    <div className="text-faint text-xs mt-0.5">
                      {orders.filter((o) => o.status !== "Cancelled").length} active orders this session
                    </div>
                  </div>
                  <div className="text-ink font-bold text-xl">
                    ₹{(runningTotal ?? 0).toFixed(2)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
