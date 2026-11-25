import { useState, useEffect } from "react";
import { getCustomerOrderHistoryApi } from "../../api/publicApi";
import VegIcon from "../common/VegIcon";

const STATUS_STYLE = {
  Pending: "bg-amber-50 text-amber-600",
  Accepted: "bg-violet-50 text-violet-600",
  Preparing: "bg-blue-50 text-blue-600",
  Ready: "bg-blue-50 text-blue-600",
  Served: "bg-green-50 text-green-600",
  Completed: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-50 text-red-600",
};

const CARD_CLASS = "border-gray-200 bg-white";
const CARD_CLASS_CANCELLED = "border-gray-200 bg-white opacity-80";

// Show "Accepted" for 2 min after restaurant accepts, even if backend moved to Preparing
const ACCEPTED_DISPLAY_MS = 2 * 60 * 1000;
const getDisplayStatus = (order) => {
  // if (order.status === "Preparing" && order.acceptedAt) {
  //   const elapsed = Date.now() - new Date(order.acceptedAt).getTime();

    // new
    if (order.status === "Preparing" && order.slipPrintedAt) {
    const elapsed = Date.now() - new Date(order.slipPrintedAt).getTime();


    if (elapsed < ACCEPTED_DISPLAY_MS) return "Accepted";
  }
  return order.status;
};

export default function OrderHistoryModal({ isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getCustomerOrderHistoryApi();
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-ink/40 z-100 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-surface rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Order history"
      >
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3 border-b border-line shrink-0 flex justify-between items-center">
          <div>
            <div className="font-display text-ink font-semibold text-lg">Your Orders</div>
            <div className="text-faint text-xs mt-0.5">All orders you've placed here</div>
          </div>
          <button onClick={onClose} aria-label="Close order history" className="w-8 h-8 rounded-full bg-page border border-line text-muted text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-line border-t-accent animate-spin" />
              <div className="text-muted text-sm">Loading your orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="font-semibold text-ink">No orders yet</div>
              <div className="text-muted text-sm mt-1">Your order history will show up here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const displayStatus = getDisplayStatus(order);
                const isCancelled = displayStatus === "Cancelled";
                const edge = isCancelled ? CARD_CLASS_CANCELLED : CARD_CLASS;

                return (
                  <div key={order._id} className={`rounded-2xl border p-5 transition-all ${edge}`}>
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
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}{" · "}
                            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[displayStatus] || STATUS_STYLE.Completed}`}>
                        {displayStatus}
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

                    {/* <div className="grid grid-cols-3 gap-2 mb-3 text-xs"> */}
                    {/* new */}
                    <div className={`grid ${Number(order.gstPercent) > 0 ? "grid-cols-3" : "grid-cols-1"} gap-2 mb-3 text-xs`}>


                      {Number(order.gstPercent) > 0 && (
                        <>
                          {/* Subtotal cell */}
                          {/* CGST+SGST cell */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">Subtotal</div>
                        <div className="text-gray-900 font-semibold">₹{(order.subtotal ?? order.totalAmount ?? 0).toFixed(2)}</div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">CGST+SGST{order.gstPercent ? ` (${order.gstPercent}%)` : ""}</div>
                        <div className="text-gray-900 font-semibold">₹{(order.gstAmount ?? 0).toFixed(2)}</div>
                      </div>
                        </>
                      )}

                      



                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="text-gray-400">Total</div>
                        <div className="text-gray-900 font-bold">₹{(order.totalAmount ?? 0).toFixed(2)}</div>
                      </div>
                    </div>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
