import { useRef, useEffect, useState } from "react";
import { getMyRestaurantApi } from "../../api/restaurantApi";

export default function KitchenSlip({ order, onClose, onPrinted }) {
  const slipRef = useRef(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    getMyRestaurantApi()
      .then((d) => setRestaurant(d.restaurant))
      .catch(() => {});
  }, []);

  const handlePrint = () => {
    const printContent = slipRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=380,height=700");
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Bill — ${order._id.slice(-6).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New', monospace; font-size:12px; color:#000; background:#fff; padding:14px; max-width:300px; margin:0 auto; }
        .center { text-align:center; } .bold { font-weight:bold; } .large { font-size:16px; } .small { font-size:10px; }
        .divider { border-top:1px dashed #000; margin:8px 0; }
        .row { display:flex; justify-content:space-between; margin:2px 0; }
        .item-row { display:flex; justify-content:space-between; margin:3px 0; }
        @media print { body { padding:6px; } }
      </style></head><body>${printContent}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body></html>
    `);
    printWindow.document.close();
    if (onPrinted) onPrinted();
  };

  const now = new Date();
  const receiptNo = `INV-${now.getFullYear()}-${order._id.slice(-4).toUpperCase()}`;
  const customerName = order.customerId?.username || "Walk-in Guest";

  // const paymentMode =
  //   order.paymentStatus === "paid"
  //     ? order.paymentMethod === "online"
  //       ? "Online / Card"
  //       : "Cash"
  //     : "Pending";

  // Bill only ever shows one of two values — never "Pending" or anything else.
// If somehow neither is true yet, default to Cash since that's the safe assumption
// for a bill physically being printed and handed to a customer.
const paymentMode = order.paymentMethod === "online" ? "Online" : "Cash";

  // all money figures come straight from the order — computed once, correctly,
  // when the order was placed. No recalculation here, no chance of drift.
  const cgstPercent = order.gstPercent / 2;
  const sgstPercent = order.gstPercent / 2;
  const cgstAmount = order.gstAmount / 2;
  const sgstAmount = order.gstAmount / 2;

  return (
    <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-4">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Bill Preview</span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          <div ref={slipRef} className="p-4 font-mono text-xs text-black">
            <div className="center bold large">
              {restaurant?.name || "Dinora Restaurant"}
            </div>
            {restaurant?.address && (
              <div className="center small" style={{ marginTop: 2 }}>
                {restaurant.address}
              </div>
            )}
            {restaurant?.phone && (
              <div className="center small">CONTACT NO: {restaurant.phone}</div>
            )}

            <div className="divider" />

            <div className="row">
              <span>Date: {now.toLocaleDateString("en-IN")}</span>
              <span>
                Time:{" "}
                {now.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="row">
              <span>Table:</span>
              <span className="bold">{order.tableId?.name || "—"}</span>
            </div>

            <div className="divider" />

            <div className="row">
              <span>RECEIPT NO</span>
              <span className="bold">{receiptNo}</span>
            </div>
            <div className="row">
              <span>CUSTOMER —</span>
              <span>{customerName}</span>
            </div>
            <div className="row">
              <span>PAYMENT MODE —</span>
              <span>{paymentMode}</span>
            </div>
            {restaurant?.gstNumber && (
              <div className="row">
                <span>GSTIN:</span>
                <span>{restaurant.gstNumber}</span>
              </div>
            )}

            <div className="divider" />

            {order.items.map((item, i) => (
              <div key={i} className="item-row">
                <span>
                  {item.qty} x {item.name}
                </span>
                <span>₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}

            <div className="divider" />

            <div className="row">
              <span>SUBTOTAL:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="row">
              <span>CGST ({cgstPercent}%):</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="row">
              <span>SGST ({sgstPercent}%):</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
            <div className="row bold large" style={{ marginTop: 4 }}>
              <span>TOTAL:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>

            <div className="divider" />

            <div className="center">THANK YOU. VISIT AGAIN.</div>
            <div className="center small" style={{ marginTop: 4 }}>
              Powered by Dinora
            </div>
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