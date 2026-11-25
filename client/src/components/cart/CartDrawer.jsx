import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  updateQty,
  clearCart,
} from "../../features/cart/cartSlice";
import { selectCurrentCustomer, identifyCustomer } from "../../features/customerAuth/customerAuthSlice";

import {
  placeOrderApi,
  createPaymentOrderApi,
  createPaymentOrderPreflightApi,
  verifyPaymentApi,
  requestCashPaymentApi,
  cancelUnpaidOrderApi, // ← was used before but never imported (threw ReferenceError on failure paths)
} from "../../api/publicApi";
import toast from "react-hot-toast";
import TokenScreen from "./TokenScreen";

const KIOSK_RESET_SECONDS = 20;

export default function CartDrawer({
  isOpen,
  onClose,
  tableId,
  tableName,
  restaurantId,
  sessionId,
  gstPercent = 5,
  isKiosk = false, // ← self-ordering kiosk: no name/phone, online only, token screen then auto-reset
  onOrderPlaced,
  onKioskReset, // ← called after the kiosk token screen finishes: parent starts a fresh session
}) {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal); // base subtotal only, before GST
  const count = useSelector(selectCartCount);
  const currentCustomer = useSelector(selectCurrentCustomer);

  // cart | payment | cash-success | online-success | kiosk-token
  const [screen, setScreen] = useState("cart");

  const [payingOnline, setPayingOnline] = useState(false);
  const [payingCash, setPayingCash] = useState(false);

  // checkout details — local only. Nothing is stored on the device and no
  // login happens: the server silently registers the customer when the
  // order is placed.
  const [showIdentify, setShowIdentify] = useState(false);
  const [identifyName, setIdentifyName] = useState("");
  const [identifyPhone, setIdentifyPhone] = useState("");

  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [placedToken, setPlacedToken] = useState(null);

  // The order placed for the CURRENT cart but not yet paid. Kept so that
  // "payment cancelled → retry" or "online failed → pay cash instead" reuses
  // the SAME order instead of creating a duplicate (and wasting a token).
  const pendingRef = useRef(null); // { order, signature }

  // ── Single source of truth for the GST breakdown ──
  // new
  const hasGst = Number(gstPercent) > 0;

  const cgstPercent = gstPercent / 2;
  const sgstPercent = gstPercent / 2;
  const cgstAmount = (total * cgstPercent) / 100;
  const sgstAmount = (total * sgstPercent) / 100;
  const finalTotal = total + cgstAmount + sgstAmount;

  const portionLabel = (item) => (item.portion === "half" ? " (Half)" : item.portion === "full" ? " (Full)" : "");

  // identifies "this exact cart" — if it changes, a previously placed
  // unpaid order is stale and must be replaced
  const cartSignature = items.map((i) => `${i.cartId}:${i.qty}`).join("|");

  const handleClose = () => {
    setScreen("cart");
    onClose();
  };

  const cancelPending = async () => {
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p?.order?._id) await cancelUnpaidOrderApi(p.order._id).catch(() => {});
  };

  // places the order for this cart exactly once (see pendingRef above)
  const placeOrderOnce = async () => {
    const p = pendingRef.current;
    if (p && p.signature === cartSignature) return p.order;
    if (p) await cancelPending(); // cart changed since → drop the stale order first

    const res = await placeOrderApi({
      restaurantId,
      sessionId,
      tableId,
      customerName: currentCustomer?.username || identifyName.trim(),
      customerPhone: currentCustomer?.phone || identifyPhone,
      items: items.map((i) => ({
        menuItemId: i._id || i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        isVeg: i.isVeg,
        portion: i.portion || null,
      })),
    });
    pendingRef.current = { order: res.order, signature: cartSignature };
    return res.order;
  };

  const finishOrder = (order, billAmount, nextScreen) => {
    pendingRef.current = null;
    dispatch(clearCart());
    setConfirmedTotal(billAmount);
    setPlacedToken(order.tokenNumber);
    setScreen(nextScreen);
    onOrderPlaced();
  };

  const handleProceedToPay = () => {
    // QR-table customers who aren't logged in give name + phone once, here.
    // Kiosk customers are never asked anything.
    if (!isKiosk && !currentCustomer) {
      setShowIdentify(true);
      return;
    }
    setScreen("payment");
  };

  const handleIdentifySubmit = async (e) => {
  e.preventDefault();
  if (!identifyName.trim()) return toast.error("Please enter your name");
  if (identifyPhone.length !== 10) return toast.error("Enter a valid 10-digit phone number");

  try {
    await dispatch(identifyCustomer({
      username: identifyName.trim(),
      phone: identifyPhone,
      restaurantId,
    })).unwrap();
    setShowIdentify(false);
    setScreen("payment");
  } catch (err) {
    toast.error(err || "Something went wrong");
  }
};

  const handleOnlinePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Refresh.");
      return;
    }
    setPayingOnline(true);
    const billAmount = finalTotal;

    try {
      const payData = await createPaymentOrderPreflightApi({ restaurantId, amount: finalTotal });
      if (!payData.success) {
        const tail = isKiosk ? "Please ask the staff for help." : "Please pay by cash.";
        const messages = {
          FEATURE_LOCKED: `This restaurant hasn't activated online payments yet. ${tail}`,
          RAZORPAY_NOT_LINKED: `This restaurant hasn't set up online payments yet. ${tail}`,
          RAZORPAY_KEY_INVALID: `This restaurant's payment setup needs attention. ${tail}`,
          RESTAURANT_NOT_FOUND: "Restaurant not found.",
        };
        toast.error(messages[payData.code] || payData.message || "Online payment isn't available right now.");
        setPayingOnline(false);
        return;
      }

      const order = await placeOrderOnce();

      const rzOrderRes = await createPaymentOrderApi({ sessionId, restaurantId, orderId: order._id });

      if (!rzOrderRes.success) {
        await cancelPending();
        toast.error("Payment setup failed. Your order was not placed.");
        setPayingOnline(false);
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
              orderId: order._id,
            });

            setPayingOnline(false);
            // success screen shows the token (a plain toast can't)
            finishOrder(order, billAmount, isKiosk ? "kiosk-token" : "online-success");
          } catch {
            setPayingOnline(false);
            toast.error("Payment verification failed. Contact staff.");
          }
        },
        prefill: {
          name: currentCustomer?.username || identifyName || "",
          contact: currentCustomer?.phone || identifyPhone || "",
        },
        theme: { color: "#C1440E" },

        modal: {
          ondismiss: async () => {
            setPayingOnline(false);
            await cancelPending();
            toast("Payment cancelled.", { icon: "ℹ️" });
          },
        },
      };
      const rzp = new window.Razorpay(options);

      // Razorpay lets the customer retry inside its own window after a
      // failure, so we only inform here — cancelling happens on dismiss.
      rzp.on("payment.failed", (resp) => {
        toast.error(`Payment failed: ${resp.error.description}.`);
      });

      rzp.open();
    } catch (err) {
      console.error("🔴 PAY ONLINE FAILED:", err);
      if (isKiosk) await cancelPending();
      toast.error(err.response?.data?.message || "Could not start payment. Try again.");
      setPayingOnline(false);
    }
  };

  const handleCashPayment = async () => {
    if (isKiosk) return; // never offered at a kiosk (server refuses it too)
    setPayingCash(true);
    const billAmount = finalTotal; // save before cart clears
    try {
      const order = await placeOrderOnce();
      await requestCashPaymentApi({ sessionId });
      finishOrder(order, billAmount, "cash-success");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setPayingCash(false);
    }
  };

  // kiosk: token screen finished → wipe everything for the next customer
  const handleKioskDone = () => {
    setScreen("cart");
    setPlacedToken(null);
    setIdentifyName("");
    setIdentifyPhone("");
    pendingRef.current = null;
    onClose();
    onKioskReset?.();
  };

  const sheetHandle = (
    <div className="pt-3 pb-1 flex justify-center shrink-0">
      <div className="w-10 h-1 bg-line rounded-full" />
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          onClick={screen === "kiosk-token" ? undefined : handleClose}
          className="fixed inset-0 bg-ink/40 z-80"
        />
      )}

      {/* ── name + phone sheet (QR table, not logged in) ── */}
      {showIdentify && (
        <div className="fixed inset-0 bg-ink/50 z-250 flex items-end justify-center">
          <div className="w-full max-w-120 bg-surface rounded-t-3xl p-6 shadow-2xl">
            <div className="text-center mb-5">
              <h3 className="font-display text-ink font-semibold text-xl">Almost there!</h3>
              <p className="text-muted text-sm mt-2">
                Your name and number, so the restaurant can reach you if needed. No login required.
              </p>
            </div>
            <form onSubmit={handleIdentifySubmit} className="space-y-3">
              <input
                type="text"
                value={identifyName}
                onChange={(e) => setIdentifyName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-page border border-line rounded-2xl px-4 py-3.5 text-ink placeholder-faint outline-none focus:border-accent"
              />
              <div className="flex items-center bg-page border border-line rounded-2xl px-4 py-3.5 focus-within:border-accent">
                <span className="text-muted font-bold text-sm shrink-0">+91</span>
                <div className="w-px h-5 bg-line mx-3" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={identifyPhone}
                  onChange={(e) => setIdentifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Phone number"
                  maxLength={10}
                  className="flex-1 bg-transparent text-ink placeholder-faint outline-none text-sm"
                />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm active:bg-accent-hover">
                Continue to Payment
              </button>
              <button type="button" onClick={() => setShowIdentify(false)} className="w-full text-muted text-sm py-2">
                Go back
              </button>
            </form>
          </div>
        </div>
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed bottom-0 left-1/2 w-full max-w-120 z-90 bg-surface rounded-t-3xl flex flex-col max-h-[88vh] transition-all duration-300 shadow-2xl"
        style={{
          transform: `translateX(-50%) translateY(${isOpen ? "0" : "100%"})`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* ── CART ── */}
        {screen === "cart" && (
          <>
            {sheetHandle}
            <div className="px-5 pt-2 pb-3 border-b border-line shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-display text-ink font-semibold text-xl">
                    Your Order
                    {count > 0 && (
                      <span className="text-faint text-sm font-sans font-normal ml-2">
                        · {count} item{count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {tableName && <div className="text-accent text-xs mt-0.5 font-medium">{tableName}</div>}
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-subtle text-muted text-sm">
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="font-semibold text-ink">Cart is empty</div>
                  <div className="text-muted text-sm mt-1">Add items from the menu</div>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.cartId} className="flex items-center gap-3 px-5 py-4 border-b border-line">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-subtle shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-ink font-semibold text-sm truncate">
                        {item.name}
                        {item.portion && <span className="text-muted font-normal">{portionLabel(item)}</span>}
                      </div>
                      <div className="text-accent font-bold text-sm mt-0.5">₹{item.price * item.qty}</div>
                    </div>
                    <div className="flex items-center bg-accent-soft rounded-xl overflow-hidden shrink-0">
                      <button
                        onClick={() => dispatch(updateQty({ cartId: item.cartId, delta: -1 }))}
                        className="w-9 h-9 text-accent text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-ink font-bold text-sm">{item.qty}</span>
                      <button
                        onClick={() => dispatch(updateQty({ cartId: item.cartId, delta: 1 }))}
                        className="w-9 h-9 text-accent text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 pt-4 pb-6 border-t border-line shrink-0">
                <div className="bg-page border border-line rounded-2xl p-4 mb-4">

                  {hasGst && ( <>
                    <div className="flex justify-between text-muted text-sm mb-1.5">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-faint text-xs mb-1">
                    <span>CGST ({cgstPercent}%)</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-faint text-xs mb-2">
                    <span>SGST ({sgstPercent}%)</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  </> )}



                  




                  <div className="flex justify-between text-ink font-bold text-base pt-2 border-t border-line">
                    <span>To Pay</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleProceedToPay}
                  className="w-full bg-accent text-white rounded-2xl py-4 font-bold text-base flex items-center justify-between px-5 active:scale-[0.98] active:bg-accent-hover transition-transform"
                >
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-xl">{count}</span>
                  <span>{isKiosk ? "Proceed to Pay" : "Proceed to Pay"}</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ── PAYMENT ── */}
        {screen === "payment" && (
          <>
            {sheetHandle}
            <div className="px-5 pt-2 pb-3 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen("cart")} className="w-8 h-8 rounded-full bg-subtle text-muted text-sm">
                  ←
                </button>
                <div>
                  <div className="font-display text-ink font-semibold text-xl">Payment</div>
                  <div className="text-faint text-xs">Bill: ₹{finalTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="bg-page border border-line rounded-2xl p-4 mb-5">
                <div className="text-faint text-xs font-bold uppercase tracking-wide mb-3">Bill Summary</div>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-2">
                    <span className="text-muted">
                      {item.name}
                      {item.portion && <span className="text-faint">{portionLabel(item)}</span>} × {item.qty}
                    </span>
                    <span className="text-ink font-semibold">₹{item.price * item.qty}</span>
                  </div>
                ))}

                {hasGst && ( <>
                  <div className="flex justify-between text-muted text-xs mt-2 pt-2 border-t border-line">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-faint text-xs">
                  <span>CGST ({cgstPercent}%)</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-faint text-xs">
                  <span>SGST ({sgstPercent}%)</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
                </> )}


                




                <div className="flex justify-between text-ink font-bold text-base pt-2 border-t border-line mt-1">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-muted text-sm font-semibold mb-3">{isKiosk ? "Pay to place your order" : "Choose payment method"}</div>

              <button
                onClick={handleOnlinePayment}
                disabled={payingOnline}
                className="w-full bg-surface border border-line hover:border-accent rounded-2xl p-4 mb-3 flex items-center justify-between transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-info-soft text-info flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-ink font-bold text-sm">{payingOnline ? "Processing..." : "Pay Now"}</div>
                    <div className="text-muted text-xs">UPI · Card · Net Banking</div>
                  </div>
                </div>
                <span className="text-ok text-xs font-bold bg-ok-soft px-2.5 py-1 rounded-lg">Instant</span>
              </button>

              {/* cash is not offered at a kiosk (and the server refuses it as well) */}
              {!isKiosk && (
                <button
                  onClick={handleCashPayment}
                  disabled={payingCash}
                  className="w-full bg-surface border border-line hover:border-accent rounded-2xl p-4 flex items-center gap-3 transition-all disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-ok-soft text-ok flex items-center justify-center text-xl font-bold">₹</div>
                  <div className="text-left">
                    <div className="text-ink font-bold text-sm">{payingCash ? "Processing..." : "Pay Later"}</div>
                    <div className="text-muted text-xs">Hand over ₹{finalTotal.toFixed(2)} to staff</div>
                  </div>
                </button>
              )}

              <p className="text-faint text-xs text-center mt-5">🔒 Payments secured by Razorpay</p>
            </div>
          </>
        )}

        {/* ── SUCCESS SCREENS (all show the token) ── */}
        {screen === "cash-success" && (
          <TokenScreen token={placedToken} amount={confirmedTotal} tableName={tableName} onDone={handleClose} />
        )}
        {screen === "online-success" && (
          <TokenScreen paid token={placedToken} amount={confirmedTotal} tableName={tableName} onDone={handleClose} />
        )}
        {screen === "kiosk-token" && (
          <TokenScreen paid token={placedToken} amount={confirmedTotal} seconds={KIOSK_RESET_SECONDS} onDone={handleKioskDone} />
        )}
      </div>
    </>
  );
}
