import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  updateQty,
  clearCart,
} from "../../features/cart/cartSlice";
import {
  selectCurrentCustomer,
  identifyCustomer,
} from "../../features/customerAuth/customerAuthSlice";
import {
  placeOrderApi,
  createPaymentOrderApi,
  createPaymentOrderPreflightApi,
  verifyPaymentApi,
  requestCashPaymentApi,
} from "../../api/publicApi";
import toast from "react-hot-toast";
import { CircleCheck, Receipt, ShoppingBag } from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  tableId,
  tableName,
  restaurantId,
  sessionId,
  gstPercent = 5,
  onOrderPlaced,
  onNeedLogin,
}) {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal); // base subtotal only, before GST
  const count = useSelector(selectCartCount);
  const currentCustomer = useSelector(selectCurrentCustomer);

  const [screen, setScreen] = useState("cart");

  const [placing, setPlacing] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const [payingCash, setPayingCash] = useState(false);

  const [showIdentify, setShowIdentify] = useState(false); // ← replaces showSaveAlert
  const [identifyName, setIdentifyName] = useState("");
  const [identifyPhone, setIdentifyPhone] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // ── Single source of truth for the GST breakdown ──────────────────
  // Declared once, at the very top of the component body, so EVERY
  // function below (handleOnlinePayment, handleCashPayment, the JSX)
  // is guaranteed to have these defined — this is what was previously
  // missing and caused "ReferenceError: finalTotal is not defined".
  const cgstPercent = gstPercent / 2;
  const sgstPercent = gstPercent / 2;
  const cgstAmount = (total * cgstPercent) / 100;
  const sgstAmount = (total * sgstPercent) / 100;
  const finalTotal = total + cgstAmount + sgstAmount;

  // ← new: small helper so the "Half"/"Full" label is built the same way
  // everywhere it's shown, instead of repeating the ternary three times
  const portionLabel = (item) =>
    item.portion === "half"
      ? " (Half)"
      : item.portion === "full"
        ? " (Full)"
        : "";

  const handleClose = () => {
    setScreen("cart");

    setPlacing(false); // ← safety reset on close, in case anything was left mid-flight

    onClose();
  };

  const handleProceedToPay = () => {
    // ← THE FIX: identification is now mandatory before paying, not optional.
    // A customer can browse and build a cart freely without providing
    // anything — but the moment they try to actually pay, we need a real
    // name and phone so the restaurant can identify and contact them.
    if (!currentCustomer && items.length > 0) {
      setShowIdentify(true);
      return;
    }

    setPlacing(false); // ← THE KEY FIX — guarantees a clean slate every time this screen opens

    setScreen("payment");
  };

  const handleIdentifySubmit = async (e) => {
    e.preventDefault();
    if (!identifyName.trim() || !identifyPhone.trim() || identifying) return;
    setIdentifying(true);
    try {
      await dispatch(
        identifyCustomer({
          username: identifyName,
          phone: identifyPhone,
          restaurantId,
        }),
      ).unwrap();
      setShowIdentify(false);
      setScreen("payment");
    } catch (error) {
      toast.error(
        error || "Could not continue. Check your details and try again.",
      );
    } finally {
      setIdentifying(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Refresh.");
      return;
    }
    // setPlacing(true);
    setPayingOnline(true);
    let placedOrderId = null; // ← track this across the whole flow

    try {
      const payData = await createPaymentOrderPreflightApi({
        restaurantId,
        amount: finalTotal,
      });
      if (!payData.success) {
        const messages = {
          FEATURE_LOCKED:
            "This restaurant hasn't activated online payments yet. Please pay by cash.",
          RAZORPAY_NOT_LINKED:
            "This restaurant hasn't set up online payments yet. Please pay by cash.",
          RAZORPAY_KEY_INVALID:
            "This restaurant's payment setup needs attention. Please pay by cash.",
          RESTAURANT_NOT_FOUND: "Restaurant not found.",
        };
        toast.error(
          messages[payData.code] ||
            payData.message ||
            "Online payment isn't available right now.",
        );
        setPlacing(false);
        return;
      }

      const orderRes = await placeOrderApi({
        restaurantId,
        sessionId,
        tableId,
        items: items.map((i) => ({
          menuItemId: i._id || i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          isVeg: i.isVeg,
          portion: i.portion || null, // ← new: carries "half" / "full" / null through to the order
        })),
      });
      placedOrderId = orderRes.order._id; // ← capture it the moment it's placed

      const rzOrderRes = await createPaymentOrderApi({
        sessionId,
        restaurantId,
      });
      if (!rzOrderRes.success) {
        // payment setup failed right after placing — clean up immediately
        await cancelUnpaidOrderApi(placedOrderId).catch(() => {});
        toast.error("Payment setup failed. Your order was not placed.");
        setPlacing(false);
        return;
      }

      const options = {
        key: rzOrderRes.keyId,
        amount: rzOrderRes.order.amount,
        currency: "INR",
        name: "Dinora",
        description: `${tableName} · ${count} item${count !== 1 ? "s" : ""}`,
        order_id: rzOrderRes.order.id,
        handler: async (response) => {
          try {
            await verifyPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              sessionId,
              restaurantId,
            });
            dispatch(clearCart());
            handleClose();
            onOrderPlaced();
            toast.success("Payment successful! Order placed 🥳");
          } catch {
            toast.error("Payment verification failed. Contact staff.");
          }
        },
        prefill: {
          name: currentCustomer?.username || "",
          contact: currentCustomer?.phone || "",
        },
        theme: { color: "#FC8019" },

        modal: {
          ondismiss: () => {
            setPlacing(false);
            // no cancellation — order stays as a normal Pending order,
            // customer can pay cash at the table instead
            toast(
              "Payment cancelled. Your order is saved — you can pay cash instead.",
              { icon: "ℹ️" },
            );
          },
        },
      };
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (resp) => {
        // no cancellation here either — same reasoning
        toast.error(
          `Payment failed: ${resp.error.description}. You can retry or pay cash.`,
        );
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      console.error("🔴 PAY ONLINE FAILED:", err);
      if (placedOrderId) {
        await cancelUnpaidOrderApi(placedOrderId).catch(() => {});
      }
      toast.error(
        err.response?.data?.message || "Could not start payment. Try again.",
      );
      // setPlacing(false);
      setPayingOnline(false);
    }
  };

  const handleCashPayment = async () => {
    // setPlacing(true);
    setPayingCash(true);
    const billAmount = finalTotal; // save before cart clears
    try {
      await placeOrderApi({
        restaurantId,
        sessionId,
        tableId,
        items: items.map((i) => ({
          menuItemId: i._id || i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          isVeg: i.isVeg,
          portion: i.portion || null, // ← new: same as the online-payment path above
        })),
      });
      await requestCashPaymentApi({ sessionId });
      setConfirmedTotal(billAmount);
      dispatch(clearCart());
      setScreen("cash-success");
      onOrderPlaced();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      // setPlacing(false);
      setPayingCash(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div onClick={handleClose} className="fixed inset-0 bg-black/70 z-80" />
      )}

      {showIdentify && (
        <div className="fixed inset-0 bg-black/85 z-250 flex items-end justify-center">
          <div className="w-full max-w-sm bg-[#2C2C2E] rounded-t-3xl p-6 shadow-2xl">
            <div className="text-center mb-5">
              {/* <div className="text-4xl mb-3">📱</div> */}
              <h3 className="text-white font-bold text-lg">Almost there!</h3>
              <p className="text-gray-400 text-sm mt-2">
                Just your name and number so the restaurant can reach you if
                needed.
              </p>
            </div>
            <form onSubmit={handleIdentifySubmit} className="space-y-3">
              <input
                type="text"
                value={identifyName}
                onChange={(e) => setIdentifyName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#FC8019]"
              />
              {/* <input
                type="tel"
                value={identifyPhone}
                onChange={(e) => setIdentifyPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#FC8019]"
              /> */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-[#FC8019]">
                <span className="text-gray-300 font-bold text-sm shrink-0">
                  +91
                </span>
                <div className="w-px h-5 bg-white/10 mx-3" />
                <input
                  type="tel"
                  value={identifyPhone}
                  onChange={(e) =>
                    setIdentifyPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Phone number"
                  maxLength={10}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={identifying}
                className="w-full py-3.5 rounded-2xl bg-[#FC8019] text-white font-bold text-sm disabled:opacity-50"
              >
                {identifying ? "Please wait..." : "Continue to Payment"}
              </button>
              <button
                type="button"
                onClick={() => setShowIdentify(false)}
                className="w-full text-gray-600 text-sm py-2"
              >
                Go back
              </button>
            </form>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-0 left-1/2 w-full max-w-120 z-90 bg-[#1C1C1E] rounded-t-3xl flex flex-col max-h-[85vh] transition-all duration-300"
        style={{
          transform: `translateX(-50%) translateY(${isOpen ? "0" : "100%"})`,
        }}
      >
        {screen === "cart" && (
          <>
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-3 border-b border-white/5 shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-bold text-lg">
                    Your Order
                    {count > 0 && (
                      <span className="text-gray-500 text-sm font-normal ml-2">
                        · {count} item{count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {tableName && (
                    <div className="text-[#FC8019] text-xs mt-0.5 font-medium">
                      {tableName}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 text-gray-400 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <div className="text-4xl mb-3">🛒</div>
                  <div className="font-semibold text-gray-400">
                    Cart is empty
                  </div>
                  <div className="text-sm mt-1">Add items from the menu</div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex items-center gap-3 px-5 py-4 border-b border-white/5"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-12 rounded-xl bg-white/5 shrink-0 flex items-center justify-center text-xl">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">
                        {item.name}
                        {/* ← new: shows "(Half)" / "(Full)" right after the name, only when relevant */}
                        {item.portion && (
                          <span className="text-gray-500 font-normal">
                            {portionLabel(item)}
                          </span>
                        )}
                      </div>
                      <div className="text-[#FC8019] font-bold text-sm mt-0.5">
                        ₹{item.price * item.qty}
                      </div>
                    </div>
                    <div className="flex items-center bg-[#2C2C2E] rounded-xl overflow-hidden shrink-0">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQty({ cartId: item.cartId, delta: -1 }),
                          )
                        }
                        className="w-9 h-9 text-[#FC8019] text-lg font-black"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-white font-bold text-sm">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(updateQty({ cartId: item.cartId, delta: 1 }))
                        }
                        className="w-9 h-9 text-[#FC8019] text-lg font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 pt-4 pb-8 border-t border-white/5 shrink-0">
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between text-gray-400 text-sm mb-1.5">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs mb-1">
                    <span>CGST ({cgstPercent}%)</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs mb-2">
                    <span>SGST ({sgstPercent}%)</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
                    <span>To Pay</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleProceedToPay}
                  className="w-full bg-[#FC8019] text-white rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
                >
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-xl">
                    {count}
                  </span>
                  <span>Proceed to Pay</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </button>
              </div>
            )}
          </>
        )}

        {screen === "payment" && (
          <>
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("cart")}
                  className="w-8 h-8 rounded-full bg-white/10 text-gray-300 text-sm"
                >
                  ←
                </button>
                <div>
                  <div className="text-white font-bold text-lg">Payment</div>
                  <div className="text-gray-500 text-xs">
                    Bill: ₹{finalTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="bg-white/5 rounded-2xl p-4 mb-5">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-3">
                  Bill Summary
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">
                      {item.name}
                      {/* ← new: same label in the bill summary */}
                      {item.portion && (
                        <span className="text-gray-500">
                          {portionLabel(item)}
                        </span>
                      )}{" "}
                      × {item.qty}
                    </span>
                    <span className="text-white font-semibold">
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-gray-400 text-xs mt-2 pt-2 border-t border-white/10">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>CGST ({cgstPercent}%)</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>SGST ({sgstPercent}%)</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10 mt-1">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-gray-400 text-sm font-semibold mb-3">
                Choose payment method
              </div>

              {/* <button onClick={handleOnlinePayment} disabled={placing} className="w-full bg-white/5 border border-white/10 hover:border-[#FC8019]/40 rounded-2xl p-4 mb-3 flex items-center justify-between transition-all disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">💳</div>
                  <div className="text-left"><div className="text-white font-bold text-sm">Pay Online</div><div className="text-gray-500 text-xs">UPI · Card · Net Banking</div></div>
                </div>
                <span className="text-[#25C866] text-xs font-bold bg-[#25C866]/10 px-2.5 py-1 rounded-lg">Instant</span>
              </button>

              <button onClick={handleCashPayment} disabled={placing} className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-3 transition-all disabled:opacity-50">
                <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">💵</div>
                <div className="text-left"><div className="text-white font-bold text-sm">Pay with Cash</div><div className="text-gray-500 text-xs">Hand over ₹{finalTotal.toFixed(2)} to staff</div></div>
              </button> */}

              {/* new btns */}
              <button
                onClick={handleOnlinePayment}
                // disabled={placing}
                disabled={payingOnline}
                className="w-full bg-white/5 border border-white/10 hover:border-[#FC8019]/40 rounded-2xl p-4 mb-3 flex items-center justify-between transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-white flex items-center justify-center text-xl">
                    {/* 💳 */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4.5 h-4.5 shrink-0"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">
                      {payingOnline ? "Processing..." : "Pay Online"}
                    </div>
                    <div className="text-gray-500 text-xs">
                      UPI · Card · Net Banking
                    </div>
                  </div>
                </div>
                <span className="text-[#25C866] text-xs font-bold bg-[#25C866]/10 px-2.5 py-1 rounded-lg">
                  Instant
                </span>
              </button>

              <button
                onClick={handleCashPayment}
                // disabled={placing}
                disabled={payingCash}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-3 transition-all disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-xl bg-green-500/20 text-white flex items-center justify-center text-xl">
                  {/* 💵 */}₹
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">
                    {payingCash ? "Processing..." : "Pay with Cash"}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Hand over ₹{finalTotal.toFixed(2)} to staff
                  </div>
                </div>
              </button>

              <p className="text-gray-600 text-xs text-center mt-5">
                🔒 Payments secured by Razorpay
              </p>
            </div>
          </>
        )}

        {/* {screen === "cash-success" && (
          <div className="px-5 py-10 text-center">
            <div className="pt-3 pb-8 flex justify-center">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="text-5xl mb-4">🙏</div>
            <div className="flex justify-center mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <Receipt className="w-5 h-5 text-blue-600" />
              <CircleCheck className="w-5 h-5 text-green-600" />
            </div>

            <div className="text-white font-bold text-xl mb-2 text-center">
              Order Placed!
            </div>
            <div className="text-gray-400 text-sm mb-6">
              Your food is being prepared
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-left">
              <div className="text-amber-300 font-bold text-sm mb-1">
                💵 Cash Payment
                ₹ Cash Payment
                Cash Payment
              </div>
              <div className="text-gray-300 text-sm">
                Please pay{" "}
                <span className="text-white font-bold">
                  ₹{confirmedTotal.toFixed(2)}
                </span>{" "}
                to the staff at your table.
              </div>
              <div className="text-gray-500 text-xs mt-1.5">
                Your bill closes once staff confirms payment received.
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-4 bg-[#FC8019] text-white rounded-2xl font-bold text-base"
            >
              Done
            </button>
          </div>
        )} */}


        {screen === "cash-success" && (
  <div className="px-5 py-8 text-center">
    {/* Handle bar */}
    <div className="pt-2 pb-6 flex justify-center">
      <div className="w-12 h-1 bg-white/15 rounded-full" />
    </div>

    {/* Success Icon */}
    <div className="flex justify-center mb-5">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-500/15 border border-green-400/25 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.25)] backdrop-blur-sm">
          <CircleCheck className="w-12 h-12 text-green-400" />
        </div>

        {/* Small floating dot */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-[#111827] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>
    </div>

    {/* Title */}
    <h2 className="text-white font-extrabold text-2xl tracking-tight mb-2">
      Order Placed!
    </h2>

    {/* Subtitle */}
    <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
      Your order has been sent to the kitchen. We’ll notify you when it starts preparing.
    </p>

    {/* Cash payment card */}
    <div className="bg-linear-to-br from-amber-500/12 to-orange-500/8 border border-amber-400/20 rounded-3xl p-5 mb-6 text-left backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-amber-300 font-semibold text-sm uppercase tracking-wide">
          Cash Payment
        </span>
        <div className="px-2 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs font-medium">
          Pending
        </div>
      </div>

      <div className="text-gray-300 text-sm leading-relaxed">
        Please pay the amount below to the staff at your table or at the counter.
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 border border-white/5 p-4">
        <div className="text-xs text-gray-400 mb-1">Amount to pay</div>
        <div className="text-3xl font-extrabold text-white tracking-tight">
          ₹{confirmedTotal.toFixed(2)}
        </div>
      </div>

      <div className="text-gray-500 text-xs mt-4 leading-relaxed">
        Your bill will be closed once the staff confirms that payment has been received.
      </div>
    </div>

    {/* Done button */}
    <button
      onClick={handleClose}
      className="w-full py-4 rounded-2xl font-bold text-base text-white bg-linear-to-r from-[#FC8019] to-[#ff9a3d] shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-transform duration-150"
    >
      Done
    </button> 
  </div>
)}


        
      </div>
    </>
  );
}
































// import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   selectCartItems,
//   selectCartTotal,
//   selectCartCount,
//   updateQty,
//   clearCart,
// } from "../../features/cart/cartSlice";
// import { selectCurrentCustomer } from "../../features/customerAuth/customerAuthSlice";
// import {
//   placeOrderApi,
//   createPaymentOrderApi,
//   createPaymentOrderPreflightApi,
//   verifyPaymentApi,
//   requestCashPaymentApi,
// } from "../../api/publicApi";
// import toast from "react-hot-toast";

// export default function CartDrawer({
//   isOpen,
//   onClose,
//   tableId,
//   tableName,
//   restaurantId,
//   sessionId,
//   gstPercent = 5,
//   onOrderPlaced,
//   onNeedLogin,
// }) {
//   const dispatch = useDispatch();
//   const items = useSelector(selectCartItems);
//   const total = useSelector(selectCartTotal); // base subtotal only, before GST
//   const count = useSelector(selectCartCount);
//   const currentCustomer = useSelector(selectCurrentCustomer);

//   const [screen, setScreen] = useState("cart");

//   const [placing, setPlacing] = useState(false);
//   const [payingOnline, setPayingOnline] = useState(false);
//   const [payingCash, setPayingCash] = useState(false);

//   const [showSaveAlert, setShowSaveAlert] = useState(false);
//   const [confirmedTotal, setConfirmedTotal] = useState(0);

//   // ── Single source of truth for the GST breakdown ──────────────────
//   // Declared once, at the very top of the component body, so EVERY
//   // function below (handleOnlinePayment, handleCashPayment, the JSX)
//   // is guaranteed to have these defined — this is what was previously
//   // missing and caused "ReferenceError: finalTotal is not defined".
//   const cgstPercent = gstPercent / 2;
//   const sgstPercent = gstPercent / 2;
//   const cgstAmount = (total * cgstPercent) / 100;
//   const sgstAmount = (total * sgstPercent) / 100;
//   const finalTotal = total + cgstAmount + sgstAmount;

//   const handleClose = () => {
//     setScreen("cart");

//     setPlacing(false); // ← safety reset on close, in case anything was left mid-flight

//     onClose();
//   };

//   const handleProceedToPay = () => {
//     if (!currentCustomer && items.length > 0) {
//       setShowSaveAlert(true);
//       return;
//     }

//     setPlacing(false); // ← THE KEY FIX — guarantees a clean slate every time this screen opens

//     setScreen("payment");
//   };

//   const handleOnlinePayment = async () => {
//     if (!window.Razorpay) {
//       toast.error("Payment gateway not loaded. Refresh.");
//       return;
//     }
//     // setPlacing(true);
//     setPayingOnline(true);
//     let placedOrderId = null; // ← track this across the whole flow

//     try {
//       const payData = await createPaymentOrderPreflightApi({
//         restaurantId,
//         amount: finalTotal,
//       });
//       if (!payData.success) {
//         const messages = {
//           FEATURE_LOCKED:
//             "This restaurant hasn't activated online payments yet. Please pay by cash.",
//           RAZORPAY_NOT_LINKED:
//             "This restaurant hasn't set up online payments yet. Please pay by cash.",
//           RAZORPAY_KEY_INVALID:
//             "This restaurant's payment setup needs attention. Please pay by cash.",
//           RESTAURANT_NOT_FOUND: "Restaurant not found.",
//         };
//         toast.error(
//           messages[payData.code] ||
//             payData.message ||
//             "Online payment isn't available right now.",
//         );
//         setPlacing(false);
//         return;
//       }

//       const orderRes = await placeOrderApi({
//         restaurantId,
//         sessionId,
//         tableId,
//         items: items.map((i) => ({
//           menuItemId: i._id || i.id,
//           name: i.name,
//           price: i.price,
//           qty: i.qty,
//           isVeg: i.isVeg,
//         })),
//       });
//       placedOrderId = orderRes.order._id; // ← capture it the moment it's placed

//       const rzOrderRes = await createPaymentOrderApi({
//         sessionId,
//         restaurantId,
//       });
//       if (!rzOrderRes.success) {
//         // payment setup failed right after placing — clean up immediately
//         await cancelUnpaidOrderApi(placedOrderId).catch(() => {});
//         toast.error("Payment setup failed. Your order was not placed.");
//         setPlacing(false);
//         return;
//       }

//       const options = {
//         key: rzOrderRes.keyId,
//         amount: rzOrderRes.order.amount,
//         currency: "INR",
//         name: "Dinora",
//         description: `${tableName} · ${count} item${count !== 1 ? "s" : ""}`,
//         order_id: rzOrderRes.order.id,
//         handler: async (response) => {
//           try {
//             await verifyPaymentApi({
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               sessionId,
//               restaurantId,
//             });
//             dispatch(clearCart());
//             handleClose();
//             onOrderPlaced();
//             toast.success("Payment successful! Order placed 🥳");
//           } catch {
//             toast.error("Payment verification failed. Contact staff.");
//           }
//         },
//         prefill: {
//           name: currentCustomer?.username || "",
//           contact: currentCustomer?.phone || "",
//         },
//         theme: { color: "#FC8019" },

//         modal: {
//           ondismiss: () => {
//             setPlacing(false);
//             // no cancellation — order stays as a normal Pending order,
//             // customer can pay cash at the table instead
//             toast(
//               "Payment cancelled. Your order is saved — you can pay cash instead.",
//               { icon: "ℹ️" },
//             );
//           },
//         },
//       };
//       const rzp = new window.Razorpay(options);

//       rzp.on("payment.failed", (resp) => {
//         // no cancellation here either — same reasoning
//         toast.error(
//           `Payment failed: ${resp.error.description}. You can retry or pay cash.`,
//         );
//         setPlacing(false);
//       });

//       rzp.open();
//     } catch (err) {
//       console.error("🔴 PAY ONLINE FAILED:", err);
//       if (placedOrderId) {
//         await cancelUnpaidOrderApi(placedOrderId).catch(() => {});
//       }
//       toast.error(
//         err.response?.data?.message || "Could not start payment. Try again.",
//       );
//       // setPlacing(false);
//       setPayingOnline(false);
//     }
//   };

//   const handleCashPayment = async () => {
//     // setPlacing(true);
//     setPayingCash(true);
//     const billAmount = finalTotal; // save before cart clears
//     try {
//       await placeOrderApi({
//         restaurantId,
//         sessionId,
//         tableId,
//         items: items.map((i) => ({
//           menuItemId: i._id || i.id,
//           name: i.name,
//           price: i.price,
//           qty: i.qty,
//           isVeg: i.isVeg,
//         })),
//       });
//       await requestCashPaymentApi({ sessionId });
//       setConfirmedTotal(billAmount);
//       dispatch(clearCart());
//       setScreen("cash-success");
//       onOrderPlaced();
//     } catch {
//       toast.error("Something went wrong. Try again.");
//     } finally {
//       // setPlacing(false);
//       setPayingCash(false);
//     }
//   };

//   return (
//     <>
//       {isOpen && (
//         <div onClick={handleClose} className="fixed inset-0 bg-black/70 z-80" />
//       )}

//       {showSaveAlert && (
//         <div className="fixed inset-0 bg-black/85 z-250 flex items-center justify-center p-4">
//           <div className="w-full max-w-sm bg-[#2C2C2E] rounded-3xl p-6 shadow-2xl">
//             <div className="text-center mb-5">
//               <div className="text-4xl mb-3">🛒</div>
//               <h3 className="text-white font-bold text-lg">Save Your Order?</h3>
//               <p className="text-gray-400 text-sm mt-2">
//                 Login to link this order with your account and track it.
//               </p>
//             </div>
//             <div className="space-y-2">
//               <button
//                 onClick={() => {
//                   setShowSaveAlert(false);
//                   onNeedLogin?.();
//                 }}
//                 className="w-full py-3.5 rounded-2xl bg-[#FC8019] text-white font-bold text-sm"
//               >
//                 Login to Save Order
//               </button>
//               <button
//                 onClick={() => {
//                   setShowSaveAlert(false);
//                   setScreen("payment");
//                 }}
//                 className="w-full py-3.5 rounded-2xl bg-white/10 text-gray-300 font-semibold text-sm"
//               >
//                 Continue Without Login
//               </button>
//               <button
//                 onClick={() => setShowSaveAlert(false)}
//                 className="w-full text-gray-600 text-sm py-2"
//               >
//                 Go back
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div
//         className="fixed bottom-0 left-1/2 w-full max-w-120 z-90 bg-[#1C1C1E] rounded-t-3xl flex flex-col max-h-[85vh] transition-all duration-300"
//         style={{
//           transform: `translateX(-50%) translateY(${isOpen ? "0" : "100%"})`,
//         }}
//       >
//         {screen === "cart" && (
//           <>
//             <div className="pt-3 pb-1 flex justify-center shrink-0">
//               <div className="w-10 h-1 bg-white/20 rounded-full" />
//             </div>
//             <div className="px-5 pt-2 pb-3 border-b border-white/5 shrink-0">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <div className="text-white font-bold text-lg">
//                     Your Order
//                     {count > 0 && (
//                       <span className="text-gray-500 text-sm font-normal ml-2">
//                         · {count} item{count !== 1 ? "s" : ""}
//                       </span>
//                     )}
//                   </div>
//                   {tableName && (
//                     <div className="text-[#FC8019] text-xs mt-0.5 font-medium">
//                       {tableName}
//                     </div>
//                   )}
//                 </div>
//                 <button
//                   onClick={handleClose}
//                   className="w-8 h-8 rounded-full bg-white/10 text-gray-400 text-sm"
//                 >
//                   ✕
//                 </button>
//               </div>
//             </div>

//             <div className="overflow-y-auto flex-1">
//               {items.length === 0 ? (
//                 <div className="text-center py-12 text-gray-600">
//                   <div className="text-4xl mb-3">🛒</div>
//                   <div className="font-semibold text-gray-400">
//                     Cart is empty
//                   </div>
//                   <div className="text-sm mt-1">Add items from the menu</div>
//                 </div>
//               ) : (
//                 items.map((item) => (
//                   <div
//                     key={item.cartId}
//                     className="flex items-center gap-3 px-5 py-4 border-b border-white/5"
//                   >
//                     {item.image ? (
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="w-14 h-12 rounded-xl object-cover shrink-0"
//                       />
//                     ) : (
//                       <div className="w-14 h-12 rounded-xl bg-white/5 shrink-0 flex items-center justify-center text-xl">
//                         🍽️
//                       </div>
//                     )}
//                     <div className="flex-1 min-w-0">
//                       <div className="text-white font-semibold text-sm truncate">
//                         {item.name}
//                       </div>
//                       <div className="text-[#FC8019] font-bold text-sm mt-0.5">
//                         ₹{item.price * item.qty}
//                       </div>
//                     </div>
//                     <div className="flex items-center bg-[#2C2C2E] rounded-xl overflow-hidden shrink-0">
//                       <button
//                         onClick={() =>
//                           dispatch(
//                             updateQty({ cartId: item.cartId, delta: -1 }),
//                           )
//                         }
//                         className="w-9 h-9 text-[#FC8019] text-lg font-black"
//                       >
//                         −
//                       </button>
//                       <span className="w-7 text-center text-white font-bold text-sm">
//                         {item.qty}
//                       </span>
//                       <button
//                         onClick={() =>
//                           dispatch(updateQty({ cartId: item.cartId, delta: 1 }))
//                         }
//                         className="w-9 h-9 text-[#FC8019] text-lg font-black"
//                       >
//                         +
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             {items.length > 0 && (
//               <div className="px-5 pt-4 pb-8 border-t border-white/5 shrink-0">
//                 <div className="bg-white/5 rounded-2xl p-4 mb-4">
//                   <div className="flex justify-between text-gray-400 text-sm mb-1.5">
//                     <span>Subtotal</span>
//                     <span>₹{total.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-gray-500 text-xs mb-1">
//                     <span>CGST ({cgstPercent}%)</span>
//                     <span>₹{cgstAmount.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-gray-500 text-xs mb-2">
//                     <span>SGST ({sgstPercent}%)</span>
//                     <span>₹{sgstAmount.toFixed(2)}</span>
//                   </div>
//                   <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
//                     <span>To Pay</span>
//                     <span>₹{finalTotal.toFixed(2)}</span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleProceedToPay}
//                   className="w-full bg-[#FC8019] text-white rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
//                 >
//                   <span className="text-sm bg-white/20 px-3 py-1 rounded-xl">
//                     {count}
//                   </span>
//                   <span>Proceed to Pay</span>
//                   <span>₹{finalTotal.toFixed(2)}</span>
//                 </button>
//               </div>
//             )}
//           </>
//         )}

//         {screen === "payment" && (
//           <>
//             <div className="pt-3 pb-1 flex justify-center shrink-0">
//               <div className="w-10 h-1 bg-white/20 rounded-full" />
//             </div>
//             <div className="px-5 pt-2 pb-3 border-b border-white/5 shrink-0">
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => setScreen("cart")}
//                   className="w-8 h-8 rounded-full bg-white/10 text-gray-300 text-sm"
//                 >
//                   ←
//                 </button>
//                 <div>
//                   <div className="text-white font-bold text-lg">Payment</div>
//                   <div className="text-gray-500 text-xs">
//                     Bill: ₹{finalTotal.toFixed(2)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="overflow-y-auto flex-1 px-5 py-4">
//               <div className="bg-white/5 rounded-2xl p-4 mb-5">
//                 <div className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-3">
//                   Bill Summary
//                 </div>
//                 {items.map((item, i) => (
//                   <div key={i} className="flex justify-between text-sm mb-2">
//                     <span className="text-gray-300">
//                       {item.name} × {item.qty}
//                     </span>
//                     <span className="text-white font-semibold">
//                       ₹{item.price * item.qty}
//                     </span>
//                   </div>
//                 ))}
//                 <div className="flex justify-between text-gray-400 text-xs mt-2 pt-2 border-t border-white/10">
//                   <span>Subtotal</span>
//                   <span>₹{total.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-gray-500 text-xs">
//                   <span>CGST ({cgstPercent}%)</span>
//                   <span>₹{cgstAmount.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-gray-500 text-xs">
//                   <span>SGST ({sgstPercent}%)</span>
//                   <span>₹{sgstAmount.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10 mt-1">
//                   <span>Total</span>
//                   <span>₹{finalTotal.toFixed(2)}</span>
//                 </div>
//               </div>

//               <div className="text-gray-400 text-sm font-semibold mb-3">
//                 Choose payment method
//               </div>

//               {/* <button onClick={handleOnlinePayment} disabled={placing} className="w-full bg-white/5 border border-white/10 hover:border-[#FC8019]/40 rounded-2xl p-4 mb-3 flex items-center justify-between transition-all disabled:opacity-50">
//                 <div className="flex items-center gap-3">
//                   <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">💳</div>
//                   <div className="text-left"><div className="text-white font-bold text-sm">Pay Online</div><div className="text-gray-500 text-xs">UPI · Card · Net Banking</div></div>
//                 </div>
//                 <span className="text-[#25C866] text-xs font-bold bg-[#25C866]/10 px-2.5 py-1 rounded-lg">Instant</span>
//               </button>

//               <button onClick={handleCashPayment} disabled={placing} className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-3 transition-all disabled:opacity-50">
//                 <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">💵</div>
//                 <div className="text-left"><div className="text-white font-bold text-sm">Pay with Cash</div><div className="text-gray-500 text-xs">Hand over ₹{finalTotal.toFixed(2)} to staff</div></div>
//               </button> */}

//               {/* new btns */}
//               <button
//                 onClick={handleOnlinePayment}
//                 // disabled={placing}
//                 disabled={payingOnline}
//                 className="w-full bg-white/5 border border-white/10 hover:border-[#FC8019]/40 rounded-2xl p-4 mb-3 flex items-center justify-between transition-all disabled:opacity-50"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-white flex items-center justify-center text-xl">
//                     {/* 💳 */}
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 shrink-0">
//   <rect x="2" y="5" width="20" height="14" rx="2" />
//   <path d="M2 10h20" />
// </svg>
//                   </div>
//                   <div className="text-left">
//                     <div className="text-white font-bold text-sm">
//                       {payingOnline ? "Processing..." : "Pay Online"}
//                     </div>
//                     <div className="text-gray-500 text-xs">
//                       UPI · Card · Net Banking
//                     </div>
//                   </div>
//                 </div>
//                 <span className="text-[#25C866] text-xs font-bold bg-[#25C866]/10 px-2.5 py-1 rounded-lg">
//                   Instant
//                 </span>
//               </button>

//               <button
//                 onClick={handleCashPayment}
//                 // disabled={placing}
//                 disabled={payingCash}
//                 className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-3 transition-all disabled:opacity-50"
//               >
//                 <div className="w-11 h-11 rounded-xl bg-green-500/20 text-white flex items-center justify-center text-xl">
//                   {/* 💵 */}
//                   ₹
//                 </div>
//                 <div className="text-left">
//                   <div className="text-white font-bold text-sm">
//                     {payingCash ? "Processing..." : "Pay with Cash"}
//                   </div>
//                   <div className="text-gray-500 text-xs">
//                     Hand over ₹{finalTotal.toFixed(2)} to staff
//                   </div>
//                 </div>
//               </button>

//               <p className="text-gray-600 text-xs text-center mt-5">
//                 🔒 Payments secured by Razorpay
//               </p>
//             </div>
//           </>
//         )}

//         {screen === "cash-success" && (
//           <div className="px-5 py-10 text-center">
//             <div className="pt-3 pb-8 flex justify-center">
//               <div className="w-10 h-1 bg-white/20 rounded-full" />
//             </div>
//             <div className="text-5xl mb-4">🙏</div>
//             <div className="text-white font-bold text-xl mb-2">
//               Order Placed!
//             </div>
//             <div className="text-gray-400 text-sm mb-6">
//               Your food is being prepared
//             </div>
//             <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-left">
//               <div className="text-amber-300 font-bold text-sm mb-1">
//                 {/* 💵 Cash Payment */}
//                 ₹ Cash Payment
//               </div>
//               <div className="text-gray-300 text-sm">
//                 Please pay{" "}
//                 <span className="text-white font-bold">
//                   ₹{confirmedTotal.toFixed(2)}
//                 </span>{" "}
//                 to the staff at your table.
//               </div>
//               <div className="text-gray-500 text-xs mt-1.5">
//                 Your bill closes once staff confirms payment received.
//               </div>
//             </div>
//             <button
//               onClick={handleClose}
//               className="w-full py-4 bg-[#FC8019] text-white rounded-2xl font-bold text-base"
//             >
//               Done
//             </button>
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
