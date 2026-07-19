import { useState, useEffect } from "react";
import { getCustomerOrderHistoryApi } from "../../api/publicApi";

const STATUS_COLOR = {
  Pending: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Accepted: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  Preparing: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Ready: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Served: "text-green-400 bg-green-400/10 border-green-400/30",
  Completed: "text-gray-400 bg-gray-400/10 border-gray-400/30",
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
    <div onClick={onClose} className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#1C1C1E] rounded-t-3xl max-h-[85vh] flex flex-col"
      >
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3 border-b border-white/5 shrink-0 flex justify-between items-center">
          <div>
            <div className="text-white font-bold text-lg">Your Orders</div>
            <div className="text-gray-500 text-xs mt-0.5">All orders you've placed here</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-gray-400 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="text-center py-12 text-gray-600 animate-pulse">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="font-semibold text-gray-400">No orders yet</div>
              <div className="text-sm mt-1">Your order history will show up here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-[#2C2C2E] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-semibold text-sm">{order.tableId?.name || "Table"}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}{" · "}
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status] || "text-gray-400 bg-gray-400/10 border-gray-400/30"}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.name} × {item.qty}</span>
                        <span className="text-gray-300">₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-gray-500 text-xs">
                      {order.paymentStatus === "paid" ? "✓ Paid" : "Payment pending"}
                    </span>
                    <span className="text-white font-bold text-sm">₹{order.totalAmount}</span>
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