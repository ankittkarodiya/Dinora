import { useState, useEffect } from "react";
import { getSessionOrdersApi } from "../../api/publicApi";
import VegIcon from "../common/VegIcon";

const STATUS_STEPS = ["Pending", "Preparing", "Ready", "Served"];

const STATUS_INFO = {
  Pending: {
    icon: "🕐",
    label: "Order Received",
    desc: "Your order has been placed",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
  },
  Preparing: {
    icon: "👨‍🍳",
    label: "Being Prepared",
    desc: "Kitchen is cooking your food",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
  Ready: {
    icon: "✅",
    label: "Ready",
    desc: "Your food is ready — waiter is on the way",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
  },
  Served: {
    icon: "🍽️",
    label: "Served",
    desc: "Enjoy your meal!",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
  Completed: {
    icon: "🎉",
    label: "Completed",
    desc: "Thank you for dining with us!",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
  },
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
              ${isDone ? "bg-blue-600 border-blue-600 text-white" : ""}
              ${isCurrent ? "bg-blue-600/20 border-blue-500 text-blue-400" : ""}
              ${!isDone && !isCurrent ? "bg-white/5 border-white/20 text-slate-500" : ""}
            `}
            >
              {isDone ? "✓" : i + 1}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${isDone ? "bg-blue-600" : "bg-white/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderTracker({ sessionId, isOpen, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // poll every 10 seconds while tracker is open
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  const runningTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-linear-to-b from-slate-800 to-slate-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] flex flex-col"
      >
        {/* Handle + header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-bold text-lg">Order Tracker</div>
              <div className="text-slate-400 text-xs mt-0.5">
                Auto-refreshes every 10 seconds
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="text-blue-400 text-xs font-semibold hover:text-blue-300"
              >
                🔄 Refresh
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 text-slate-400 hover:bg-white/20 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-3xl mb-3 animate-pulse">🍽️</div>
              <div>Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-3xl mb-3">📋</div>
              <div className="font-semibold">No orders yet</div>
              <div className="text-sm mt-1">Place an order from the menu</div>
            </div>
          ) : (
            <>
              {orders.map((order, index) => {
                const statusInfo =
                  STATUS_INFO[order.status] || STATUS_INFO.Pending;
                return (
                  <div
                    key={order._id}
                    className={`rounded-2xl border ${statusInfo.border} ${statusInfo.bg} p-4`}
                  >
                    {/* Order number + status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-white font-bold text-sm">
                        Order #{index + 1}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.border} ${statusInfo.bg} ${statusInfo.color}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* Status bar */}
                    {order.status !== "Completed" && (
                      <StatusBar status={order.status} />
                    )}

                    {/* Status description */}
                    <div
                      className={`text-xs font-semibold mb-3 ${statusInfo.color}`}
                    >
                      {statusInfo.desc}
                    </div>

                    {/* Items */}
                    <div className="space-y-2 bg-black/20 rounded-xl p-3 mb-3">
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <VegIcon isVeg={item.isVeg} />
                            <span className="text-slate-200 text-sm">
                              {item.name}
                            </span>
                            <span className="text-slate-500 text-xs">
                              ×{item.qty}
                            </span>
                          </div>
                          <span className="text-slate-300 text-sm font-semibold">
                            ₹{item.price * item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order total */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-white font-bold text-sm">
                        {/* ₹{order.totalAmount} */}
                        {(order.totalAmount ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Running total */}
              {orders.length > 1 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between items-center">
                  <div>
                    <div className="text-white font-bold">Running Total</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {orders.length} orders placed this session
                    </div>
                  </div>
                  <div className="text-white font-bold text-xl">
                    {/* ₹{runningTotal} */}
                    {(runningTotal ?? 0).toFixed(2)}
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
