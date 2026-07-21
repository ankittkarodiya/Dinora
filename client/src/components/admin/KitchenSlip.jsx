import { useRef, useEffect, useState } from "react";
import { getMyRestaurantApi } from "../../api/restaurantApi";

export default function KitchenSlip({ order, onClose, onPrinted }) {
  const [restaurant, setRestaurant] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    getMyRestaurantApi()
      .then((d) => setRestaurant(d.restaurant))
      .catch(() => {});
  }, []);

  const now = new Date();
  const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
  const customerName = order.customerId?.username || "Walk-in Guest";
  const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";
  const cgstPercent = order.gstPercent / 2;
  const sgstPercent = order.gstPercent / 2;
  const cgstAmount = order.gstAmount / 2;
  const sgstAmount = order.gstAmount / 2;

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; max-width: 300px; margin: 0 auto; padding: 14px; }
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
          <tr><td>Table:</td><td class="right bold">${order.tableId?.name || "—"}</td></tr>
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>RECEIPT NO</td><td class="right bold">${receiptNo}</td></tr>
          <tr><td>CUSTOMER</td><td class="right">${customerName}</td></tr>
          <tr><td>PAYMENT MODE</td><td class="right">${paymentMode}</td></tr>
          ${restaurant?.gstNumber ? `<tr><td>GSTIN</td><td class="right">${restaurant.gstNumber}</td></tr>` : ""}
        </table>
        <div class="divider"></div>
        <table>
          ${order.items.map((item) => `<tr><td>${item.qty} x ${item.name}</td><td class="right">₹${(item.price * item.qty).toFixed(2)}</td></tr>`).join("")}
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>SUBTOTAL</td><td class="right">₹${order.subtotal.toFixed(2)}</td></tr>
          <tr><td>CGST (${cgstPercent}%)</td><td class="right">₹${cgstAmount.toFixed(2)}</td></tr>
          <tr><td>SGST (${sgstPercent}%)</td><td class="right">₹${sgstAmount.toFixed(2)}</td></tr>
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
              <span>Table:</span>
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
            <div className="flex justify-between">
              <span>PAYMENT MODE</span>
              <span>{paymentMode}</span>
            </div>
            {restaurant?.gstNumber && (
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
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
          >
            🖨️ Print Bill
          </button>
        </div>
        <p className="text-center text-slate-500 text-xs mt-3">
          Printing moves order to "Preparing"
        </p>
      </div>
    </div>
  );
}
















// very much corrected
// import { useRef, useEffect, useState } from "react";
// import { getMyRestaurantApi } from "../../api/restaurantApi";

// export default function KitchenSlip({ order, onClose, onPrinted }) {
//   const [restaurant, setRestaurant] = useState(null);

//   useEffect(() => {
//     getMyRestaurantApi()
//       .then((d) => setRestaurant(d.restaurant))
//       .catch(() => {});
//   }, []);

//   // const handlePrint = () => {
//   //   window.print();
//   //   if (onPrinted) onPrinted();
//   // };
//   const handlePrint = () => {
//   const printWindow = window.open("", "_blank");
//   if (!printWindow) {
//     toast.error("Please allow pop-ups to print the bill");
//     return;
//   }
//   printWindow.document.write(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>Bill</title>
//         <style>
//           @page { margin: 10mm; }
//           body { font-family: 'Courier New', monospace; }
//         </style>
//       </head>
//       <body>${receiptHTML}</body>
//     </html>
//   `);
//   printWindow.document.close();

//   // ← THE FIX for mobile: wait for the new document to genuinely finish
//   // loading before printing, instead of calling print() immediately
//   printWindow.onload = () => {
//     printWindow.focus();
//     printWindow.print();
//     printWindow.close();
//   };

//   if (onPrinted) onPrinted();
// };

//   const now = new Date();
//   const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
//   const customerName = order.customerId?.username || "Walk-in Guest";
//   const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";
//   const cgstPercent = order.gstPercent / 2;
//   const sgstPercent = order.gstPercent / 2;
//   const cgstAmount = order.gstAmount / 2;
//   const sgstAmount = order.gstAmount / 2;

//   // Plain HTML/inline-styles only — no Tailwind flex/grid classes, so there's
//   // nothing for print's display recalculation to conflict with. Used for
//   // BOTH the on-screen preview and the actual printed receipt, via
//   // dangerouslySetInnerHTML, so the two can never drift out of sync.
//   const receiptHTML = `
//     <div style="font-family: 'Courier New', monospace; font-size: 12px; color: #000; max-width: 300px; margin: 0 auto; padding: 14px;">
//       <div style="text-align:center; font-weight:bold; font-size:16px;">${restaurant?.name || "Dinora Restaurant"}</div>
//       ${restaurant?.address ? `<div style="text-align:center; font-size:10px; margin-top:2px;">${restaurant.address}</div>` : ""}
//       ${restaurant?.phone ? `<div style="text-align:center; font-size:10px;">CONTACT NO: ${restaurant.phone}</div>` : ""}
//       <div style="border-top:1px dashed #000; margin:8px 0;"></div>
//       <table style="width:100%; font-size:12px; border-collapse:collapse;">
//         <tr><td>Date: ${now.toLocaleDateString("en-IN")}</td><td style="text-align:right;">Time: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td></tr>
//         <tr><td>Table:</td><td style="text-align:right; font-weight:bold;">${order.tableId?.name || "—"}</td></tr>
//       </table>
//       <div style="border-top:1px dashed #000; margin:8px 0;"></div>
//       <table style="width:100%; font-size:12px; border-collapse:collapse;">
//         <tr><td>RECEIPT NO</td><td style="text-align:right; font-weight:bold;">${receiptNo}</td></tr>
//         <tr><td>CUSTOMER</td><td style="text-align:right;">${customerName}</td></tr>
//         <tr><td>PAYMENT MODE</td><td style="text-align:right;">${paymentMode}</td></tr>
//         ${restaurant?.gstNumber ? `<tr><td>GSTIN</td><td style="text-align:right;">${restaurant.gstNumber}</td></tr>` : ""}
//       </table>
//       <div style="border-top:1px dashed #000; margin:8px 0;"></div>
//       <table style="width:100%; font-size:12px; border-collapse:collapse;">
//         ${order.items.map((item) => `<tr><td>${item.qty} x ${item.name}</td><td style="text-align:right;">₹${(item.price * item.qty).toFixed(2)}</td></tr>`).join("")}
//       </table>
//       <div style="border-top:1px dashed #000; margin:8px 0;"></div>
//       <table style="width:100%; font-size:12px; border-collapse:collapse;">
//         <tr><td>SUBTOTAL</td><td style="text-align:right;">₹${order.subtotal.toFixed(2)}</td></tr>
//         <tr><td>CGST (${cgstPercent}%)</td><td style="text-align:right;">₹${cgstAmount.toFixed(2)}</td></tr>
//         <tr><td>SGST (${sgstPercent}%)</td><td style="text-align:right;">₹${sgstAmount.toFixed(2)}</td></tr>
//         <tr style="font-weight:bold; font-size:14px;"><td>TOTAL</td><td style="text-align:right;">₹${order.totalAmount.toFixed(2)}</td></tr>
//       </table>
//       <div style="border-top:1px dashed #000; margin:8px 0;"></div>
//       <div style="text-align:center;">THANK YOU. VISIT AGAIN.</div>
//       <div style="text-align:center; font-size:10px; margin-top:4px;">Powered by Dinora</div>
//     </div>
//   `;

//   return (
//     <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4 print:hidden">
//       <style>{`
//         @media print {
//           body { visibility: hidden; }
//           #dinora-print-receipt, #dinora-print-receipt * { visibility: visible; }
//           #dinora-print-receipt {
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100%;
//           }
//         }
//       `}</style>

//       <div className="w-full max-w-sm">
//         <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
//           <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
//             <span className="text-white font-bold text-sm">Bill Preview</span>
//             <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
//               ✕
//             </button>
//           </div>
//           {/* on-screen preview — safe to render normally, this whole
//               modal is print:hidden and never shows up in the printed output */}
//           <div
//             className="p-4 font-mono text-xs text-black"
//             dangerouslySetInnerHTML={{ __html: receiptHTML }}
//           />
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handlePrint}
//             className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
//           >
//             🖨️ Print Bill
//           </button>
//         </div>
//         <p className="text-center text-slate-500 text-xs mt-3">
//           Printing moves order to "Preparing"
//         </p>
//       </div>

//       {/* ← THE ACTUAL PRINTED CONTENT — hidden entirely in normal view via
//           "hidden", only becomes visible during print via the @media print
//           rule above, which also hides the entire rest of the page (body) */}
//       <div
//         id="dinora-print-receipt"
//         className="hidden"
//         dangerouslySetInnerHTML={{ __html: receiptHTML }}
//       />
//     </div>
//   );
// }























// import { useRef, useEffect, useState } from "react";
// import { getMyRestaurantApi } from "../../api/restaurantApi";

// export default function KitchenSlip({ order, onClose, onPrinted }) {
//   const slipRef = useRef(null);
//   const [restaurant, setRestaurant] = useState(null);

//   useEffect(() => {
//     getMyRestaurantApi()
//       .then((d) => setRestaurant(d.restaurant))
//       .catch(() => {});
//   }, []);

//   // Simple — window.print() renders whatever's on the page. The @media
//   // print CSS below is what makes ONLY the receipt visible when this runs.
//   const handlePrint = () => {
//     window.print();
//     if (onPrinted) onPrinted();
//   };

//   const now = new Date();
//   const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
//   const customerName = order.customerId?.username || "Walk-in Guest";
//   const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";
//   const cgstPercent = order.gstPercent / 2;
//   const sgstPercent = order.gstPercent / 2;
//   const cgstAmount = order.gstAmount / 2;
//   const sgstAmount = order.gstAmount / 2;

//   return (
//     <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4 print:hidden">
//       {/* ← THE FIX: display:none, not visibility:hidden — this removes
//           everything from layout entirely during print, so there's no
//           leftover blank space causing extra pages. Only the receipt
//           wrapper is re-enabled below. */}
//       <style>{`
//         @media print {
//           body * {
//             display: none !important;
//           }
//           #kitchen-slip-print-wrapper,
//           #kitchen-slip-print-wrapper * {
//             display: revert !important;
//           }
//           #kitchen-slip-print-wrapper {
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100%;
//             padding: 12px;
//             background: white;
//           }
//         }
//       `}</style>

//       <div className="w-full max-w-sm">
//         <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
//           <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
//             <span className="text-white font-bold text-sm">Bill Preview</span>
//             <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
//               ✕
//             </button>
//           </div>

//           {/* ← Only this div, and everything inside it, survives the
//               display:none rule above — the header bar and buttons
//               outside this div are correctly excluded from print */}
//           <div ref={slipRef} id="kitchen-slip-print-wrapper" className="p-4 font-mono text-xs text-black">
//             <div className="text-center font-bold text-base">
//               {restaurant?.name || "Dinora Restaurant"}
//             </div>
//             {restaurant?.address && (
//               <div className="text-center text-[10px] mt-0.5">{restaurant.address}</div>
//             )}
//             {restaurant?.phone && (
//               <div className="text-center text-[10px]">CONTACT NO: {restaurant.phone}</div>
//             )}

//             <div className="border-t border-dashed border-black my-2" />

//             <div className="flex justify-between">
//               <span>Date: {now.toLocaleDateString("en-IN")}</span>
//               <span>
//                 Time: {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
//               </span>
//             </div>
//             <div className="flex justify-between">
//               <span>Table:</span>
//               <span className="font-bold">{order.tableId?.name || "—"}</span>
//             </div>

//             <div className="border-t border-dashed border-black my-2" />

//             <div className="flex justify-between">
//               <span>RECEIPT NO</span>
//               <span className="font-bold">{receiptNo}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>CUSTOMER</span>
//               <span>{customerName}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>PAYMENT MODE</span>
//               <span>{paymentMode}</span>
//             </div>
//             {restaurant?.gstNumber && (
//               <div className="flex justify-between">
//                 <span>GSTIN</span>
//                 <span>{restaurant.gstNumber}</span>
//               </div>
//             )}

//             <div className="border-t border-dashed border-black my-2" />

//             {order.items.map((item, i) => (
//               <div key={i} className="flex justify-between mb-0.5">
//                 <span>{item.qty} x {item.name}</span>
//                 <span>₹{(item.price * item.qty).toFixed(2)}</span>
//               </div>
//             ))}

//             <div className="border-t border-dashed border-black my-2" />

//             <div className="flex justify-between">
//               <span>SUBTOTAL</span>
//               <span>₹{order.subtotal.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>CGST ({cgstPercent}%)</span>
//               <span>₹{cgstAmount.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>SGST ({sgstPercent}%)</span>
//               <span>₹{sgstAmount.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between font-bold text-sm mt-1">
//               <span>TOTAL</span>
//               <span>₹{order.totalAmount.toFixed(2)}</span>
//             </div>

//             <div className="border-t border-dashed border-black my-2" />

//             <div className="text-center">THANK YOU. VISIT AGAIN.</div>
//             <div className="text-center text-[10px] mt-1">Powered by Dinora</div>
//           </div>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handlePrint}
//             className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
//           >
//             🖨️ Print Bill
//           </button>
//         </div>
//         <p className="text-center text-slate-500 text-xs mt-3">
//           Printing moves order to "Preparing"
//         </p>
//       </div>
//     </div>
//   );
// }

























// import { useRef, useEffect, useState } from "react";
// import { getMyRestaurantApi } from "../../api/restaurantApi";

// export default function KitchenSlip({ order, onClose, onPrinted }) {
//   const slipRef = useRef(null);
//   const [restaurant, setRestaurant] = useState(null);

//   useEffect(() => {
//     getMyRestaurantApi()
//       .then((d) => setRestaurant(d.restaurant))
//       .catch(() => {});
//   }, []);

//   const handlePrint = () => {
//     const printContent = slipRef.current.innerHTML;
//     const printWindow = window.open("", "_blank", "width=380,height=700");

//     printWindow.document.write(`
//       <!DOCTYPE html><html><head><title>Bill — ${order._id.slice(-6).toUpperCase()}</title>
//       <style>
//         * { margin:0; padding:0; box-sizing:border-box; }
//         body { font-family:'Courier New', monospace; font-size:12px; color:#000; background:#fff; padding:14px; max-width:300px; margin:0 auto; }
//         .center { text-align:center; } .bold { font-weight:bold; } .large { font-size:16px; } .small { font-size:10px; }
//         .divider { border-top:1px dashed #000; margin:8px 0; }
//         .row { display:flex; justify-content:space-between; margin:2px 0; }
//         .item-row { display:flex; justify-content:space-between; margin:3px 0; }
//         @media print { body { padding:6px; } }
//       </style></head><body>${printContent}
//       <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
//       </body></html>
//     `);
//     printWindow.document.close();
//     if (onPrinted) onPrinted();
//   };

//   const now = new Date();
//   const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
//   const customerName = order.customerId?.username || "Walk-in Guest";

//   // const paymentMode =
//   //   order.paymentStatus === "paid"
//   //     ? order.paymentMethod === "online"
//   //       ? "Online / Card"
//   //       : "Cash"
//   //     : "Pending";

//   // Bill only ever shows one of two values — never "Pending" or anything else.
// // If somehow neither is true yet, default to Cash since that's the safe assumption
// // for a bill physically being printed and handed to a customer.
// const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";

//   // all money figures come straight from the order — computed once, correctly,
//   // when the order was placed. No recalculation here, no chance of drift.
//   const cgstPercent = order.gstPercent / 2;
//   const sgstPercent = order.gstPercent / 2;
//   const cgstAmount = order.gstAmount / 2;
//   const sgstAmount = order.gstAmount / 2;

//   return (
//     <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4">
//       <div className="w-full max-w-sm">
//         <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
//           <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
//             <span className="text-white font-bold text-sm">Bill Preview</span>
//             <button
//               onClick={onClose}
//               className="text-slate-400 hover:text-white text-lg"
//             >
//               ✕
//             </button>
//           </div>

//           <div ref={slipRef} className="p-4 font-mono text-xs text-black">
//             <div className="center bold large">
//               {restaurant?.name || "Dinora Restaurant"}
//             </div>
//             {restaurant?.address && (
//               <div className="center small" style={{ marginTop: 2 }}>
//                 {restaurant.address}
//               </div>
//             )}
//             {restaurant?.phone && (
//               <div className="center small">CONTACT NO: {restaurant.phone}</div>
//             )}

//             <div className="divider" />

//             <div className="row">
//               <span>Date: {now.toLocaleDateString("en-IN")}</span>
//               <span>
//                 Time:{" "}
//                 {now.toLocaleTimeString("en-IN", {
//                   hour: "2-digit",
//                   minute: "2-digit",
//                 })}
//               </span>
//             </div>
//             <div className="row">
//               <span>Table:</span>
//               <span className="bold">{order.tableId?.name || "—"}</span>
//             </div>

//             <div className="divider" />

//             <div className="row">
//               <span>RECEIPT NO</span>
//               <span className="bold">{receiptNo}</span>
//             </div>
//             <div className="row">
//               <span>CUSTOMER —</span>
//               <span>{customerName}</span>
//             </div>
//             <div className="row">
//               <span>PAYMENT MODE —</span>
//               <span>{paymentMode}</span>
//             </div>
//             {restaurant?.gstNumber && (
//               <div className="row">
//                 <span>GSTIN:</span>
//                 <span>{restaurant.gstNumber}</span>
//               </div>
//             )}

//             <div className="divider" />

//             {order.items.map((item, i) => (
//               <div key={i} className="item-row">
//                 <span>
//                   {item.qty} x {item.name}
//                 </span>
//                 <span>₹{(item.price * item.qty).toFixed(2)}</span>
//               </div>
//             ))}

//             <div className="divider" />

//             <div className="row">
//               <span>SUBTOTAL:</span>
//               <span>₹{order.subtotal.toFixed(2)}</span>
//             </div>
//             <div className="row">
//               <span>CGST ({cgstPercent}%):</span>
//               <span>₹{cgstAmount.toFixed(2)}</span>
//             </div>
//             <div className="row">
//               <span>SGST ({sgstPercent}%):</span>
//               <span>₹{sgstAmount.toFixed(2)}</span>
//             </div>
//             <div className="row bold large" style={{ marginTop: 4 }}>
//               <span>TOTAL:</span>
//               <span>₹{order.totalAmount.toFixed(2)}</span>
//             </div>

//             <div className="divider" />

//             <div className="center">THANK YOU. VISIT AGAIN.</div>
//             <div className="center small" style={{ marginTop: 4 }}>
//               Powered by Dinora
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={onClose}
//             className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handlePrint}
//             className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
//           >
//             🖨️ Print Bill
//           </button>
//         </div>
//         <p className="text-center text-slate-500 text-xs mt-3">
//           Printing moves order to "Preparing"
//         </p>
//       </div>
//     </div>
//   );
// }