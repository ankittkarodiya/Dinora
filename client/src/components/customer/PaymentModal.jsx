import { useState, useEffect } from "react";
import { getSessionOrdersApi, createPaymentOrderApi, verifyPaymentApi, requestCashPaymentApi } from "../../api/publicApi";
import toast from "react-hot-toast";

export default function PaymentModal({ sessionId, onClose, onSuccess }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState(null); // "online" | "cash"

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSessionOrdersApi(sessionId);
        // only active (non-cancelled) orders
        setOrders((data.orders || []).filter((o) => o.status !== "Cancelled"));
      } catch { }
      finally { setLoading(false); }
    };
    fetch();
  }, [sessionId]);

  const total = orders.reduce((s, o) => s + o.totalAmount, 0);
  const itemCount = orders.reduce((s, o) => s + o.items.length, 0);

  const handleOnlinePayment = async () => {
    setPaying(true);
    try {
      if (total < 1) {
        toast.error("Total must be at least ₹1 to pay online.");
        setPaying(false);
        return;
      }
      if (!window.Razorpay) {
        toast.error("Razorpay checkout failed to load.");
        setPaying(false);
        return;
      }

      // create Razorpay order
      const data = await createPaymentOrderApi({ amount: total, sessionId });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "Dinora",
        description: `Bill Payment - ${orders.length} order${orders.length !== 1 ? "s" : ""}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await verifyPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              sessionId,
            });
            setPaying(false);
            onSuccess();
          } catch {
            setPaying(false);
            toast.error("Payment verification failed. Contact staff.");
          }
        },
        prefill: { name: "", contact: "" },
        theme: { color: "#3B82F6" },
        modal: { ondismiss: () => setPaying(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (failure) => {
        console.error("Razorpay payment failed", failure);
        toast.error("Payment failed or was canceled.");
        setPaying(false);
      });
      razorpay.open();
    } catch (error) {
      console.error("Razorpay checkout error", error);
      toast.error(error.response?.data?.message || "Could not initiate payment. Try again.");
      setPaying(false);
    }
  };

  const handleCashPayment = async () => {
    setPaying(true);
    try {
      await requestCashPaymentApi({ sessionId });
      toast.success("Cash payment recorded. Please pay at the counter.");
      onSuccess();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center">
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-linear-to-b from-slate-800 to-slate-900 border-t border-white/10 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">

        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white font-bold text-xl">💳 Pay Your Bill</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 text-slate-400 text-sm">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading bill...</div>
        ) : (
          <>
            {/* Bill summary */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-5">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-3">
                Bill Summary · {orders.length} order{orders.length !== 1 ? "s" : ""} · {itemCount} items
              </div>
              {orders.map((order, i) => (
                <div key={order._id} className="mb-3 last:mb-0">
                  <div className="text-slate-300 text-xs font-semibold mb-1">
                    Order #{i + 1} · {order.tableId?.name || ""}
                  </div>
                  {order.items.map((item, j) => (
                    <div key={j} className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{item.name} × {item.qty}</span>
                      <span className="text-slate-300">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="border-t border-white/10 mt-3 pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="text-white font-bold text-2xl">₹{total}</span>
              </div>
            </div>

            {/* Payment options */}
            <div className="text-slate-300 text-sm font-semibold mb-3">Choose payment method:</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setPayMethod("online")}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  payMethod === "online"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-1">💳</div>
                <div className="text-white font-bold text-sm">Online</div>
                <div className="text-slate-400 text-xs">UPI / Card / Net Banking</div>
              </button>

              <button
                onClick={() => setPayMethod("cash")}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  payMethod === "cash"
                    ? "border-green-500 bg-green-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-1">💵</div>
                <div className="text-white font-bold text-sm">Cash</div>
                <div className="text-slate-400 text-xs">Pay at counter</div>
              </button>
            </div>

            {payMethod === "online" && (
              <button
                onClick={handleOnlinePayment}
                disabled={paying}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-50"
              >
                {paying ? "Opening payment..." : `Pay ₹${total} Online →`}
              </button>
            )}

            {payMethod === "cash" && (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300 text-sm text-center">
                  Please visit the counter to pay ₹{total} in cash
                </div>
                <button
                  onClick={handleCashPayment}
                  disabled={paying}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-all disabled:opacity-50"
                >
                  {paying ? "Recording..." : "Confirm Cash Payment →"}
                </button>
              </div>
            )}

            {!payMethod && (
              <div className="text-center text-slate-500 text-sm py-2">
                Select a payment method above
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}