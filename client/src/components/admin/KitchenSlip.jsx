import { useRef, useEffect, useState } from "react";
import { getMyRestaurantApi } from "../../api/restaurantApi";

// export default function KitchenSlip({ order, onClose, onPrinted }) {

// new for counter orders
export default function KitchenSlip({ order, onClose, onPrinted, hideNote = false, closeLabel = "Cancel" }) {

  const [restaurant, setRestaurant] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    getMyRestaurantApi()
      .then((d) => setRestaurant(d.restaurant))
      .catch(() => {});
  }, []);

  const now = new Date();
  const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
  // const customerName = order.customerId?.username || "Walk-in Guest";
  const customerName = order.customerId?.username || order.guestName || "Walk-in Guest"

  // const customerPhone = order.customerId?.phone?.replace(/^\+?91/, "") || ""; // ← strips the +91 prefix for display only
  const customerPhone = (order.customerId?.phone || order.guestPhone)?.replace(/^\+?91/, "") || ""; // ← strips the +91 prefix for display only

  const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";
  const cgstPercent = order.gstPercent / 2;
  const sgstPercent = order.gstPercent / 2;
  const cgstAmount = order.gstAmount / 2;
  const sgstAmount = order.gstAmount / 2;

  // new
  const hasGst = Number(order.gstPercent) > 0;


  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: 80mm auto; margin: 0; } /* 80mm wide, height grows to fit content automatically */

          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; max-width: 80mm; margin: 0 auto; padding: 6px; }

          table { width: 100%; font-size: 12px; border-collapse: collapse; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          .small { font-size: 10px; }
          .right { text-align: right; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="center bold large">${restaurant?.name || "Dinora Restaurant"}</div>
        ${restaurant?.address ? `<div class="center small" style="margin-top:2px;">${restaurant.address}</div>` : ""}
        ${restaurant?.phone ? `<div class="center small">CONTACT NO: ${restaurant.phone}</div>` : ""}
        <div class="divider"></div>
        <table>
          <tr><td>Date: ${now.toLocaleDateString("en-IN")}</td><td class="right">Time: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td></tr>
          
          <tr><td>Order Point:</td><td class="right bold">${order.tableId?.name || "—"}</td></tr>
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>RECEIPT NO</td><td class="right bold">${receiptNo}</td></tr>
          <tr><td>CUSTOMER</td><td class="right">${customerName}</td></tr>
          ${customerPhone ? `<tr><td>PHONE</td><td class="right">${customerPhone}</td></tr>` : ""}


          <tr><td>PAYMENT MODE</td><td class="right">${paymentMode}</td></tr>

          ${restaurant?.gstNumber && hasGst ? `<tr><td>GSTIN</td><td class="right">${restaurant.gstNumber}</td></tr>` : ""}

        </table>
        <div class="divider"></div>
        <table>
          ${order.items.map((item) => `<tr><td>${item.qty} x ${item.name}</td><td class="right">₹${(item.price * item.qty).toFixed(2)}</td></tr>`).join("")}
        </table>
        <div class="divider"></div>
        <table>

          ${hasGst ? `
          <tr><td>SUBTOTAL</td><td class="right">₹${order.subtotal.toFixed(2)}</td></tr>
          <tr><td>CGST (${cgstPercent}%)</td><td class="right">₹${cgstAmount.toFixed(2)}</td></tr>
          <tr><td>SGST (${sgstPercent}%)</td><td class="right">₹${sgstAmount.toFixed(2)}</td></tr>` : ""}

          <tr class="bold large"><td>TOTAL</td><td class="right">₹${order.totalAmount.toFixed(2)}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="center">THANK YOU. VISIT AGAIN.</div>
        <div class="center small" style="margin-top:4px;">Powered by Dinora</div>
      </body>
    </html>
  `;

  // ← THE FIX: an invisible iframe, written to and printed directly,
  // never leaves the current page at all — no new tab, no popup
  // blocker risk, works identically on desktop and mobile.
  const handlePrint = () => {
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHTML);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    if (onPrinted) onPrinted();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4">
      {/* ← invisible, zero-size — lives on the same page, never seen,
          only used as an isolated document for the actual print job */}
      <iframe
        ref={iframeRef}
        style={{ position: "absolute", width: 0, height: 0, border: 0 }}
        title="print-frame"
      />

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Bill Preview</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
              ✕
            </button>
          </div>
          <div className="p-4 font-mono text-xs text-black">
            <div className="text-center font-bold text-base">
              {restaurant?.name || "Dinora Restaurant"}
            </div>
            {restaurant?.address && (
              <div className="text-center text-[10px] mt-0.5">{restaurant.address}</div>
            )}
            {restaurant?.phone && (
              <div className="text-center text-[10px]">CONTACT NO: {restaurant.phone}</div>
            )}
            <div className="border-t border-dashed border-black my-2" />
            <div className="flex justify-between">
              <span>Date: {now.toLocaleDateString("en-IN")}</span>
              <span>Time: {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex justify-between">
              {/* <span>Table:</span> */}

              <span>Order Point:</span>
              <span className="font-bold">{order.tableId?.name || "—"}</span>
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="flex justify-between">
              <span>RECEIPT NO</span>
              <span className="font-bold">{receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span>CUSTOMER</span>
              <span>{customerName}</span>
            </div>
            {customerPhone && (
  <div className="flex justify-between">
    <span>PHONE</span>
    <span>{customerPhone}</span>
  </div>
)}

            <div className="flex justify-between">
              <span>PAYMENT MODE</span>
              <span>{paymentMode}</span>
            </div>
            {/* {restaurant?.gstNumber && ( */}
            {/* new */}
            {restaurant?.gstNumber && hasGst && (
              <div className="flex justify-between">
                <span>GSTIN</span>
                <span>{restaurant.gstNumber}</span>
              </div>
            )}
            <div className="border-t border-dashed border-black my-2" />
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between mb-0.5">
                <span>{item.qty} x {item.name}</span>
                <span>₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-black my-2" />


            {hasGst && ( <>
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST ({cgstPercent}%)</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({sgstPercent}%)</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
            </> )}

            

            <div className="flex justify-between font-bold text-sm mt-1">
              <span>TOTAL</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center">THANK YOU. VISIT AGAIN.</div>
            <div className="text-center text-[10px] mt-1">Powered by Dinora</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm"
          >
            {/* Cancel */}

            {/* new for counter orders */}
            {closeLabel}
          </button>

          <button
  onClick={handlePrint}
  className="flex flex-1 items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 shrink-0"
  >
    <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16a2 2 0 012 2v6h-4M2 17v-6a2 2 0 012-2" />
  </svg>

  <span className="whitespace-nowrap">Print Bill</span>
</button>

        </div>

        {/* <p className="text-center text-slate-500 text-xs mt-3">
          Printing moves order to "Preparing"
        </p> */}

        {/* new for counter orders */}
        {!hideNote && (
          <p className="text-center text-slate-500 text-xs mt-3">
            Printing moves order to "Preparing"
          </p>
        )}

      </div>
    </div>
  );
}
