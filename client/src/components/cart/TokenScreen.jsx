import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";

// Big "your token" screen. Used for:
//   - kiosk: countdown then auto-resets for the next customer
//   - QR table: after an online payment / cash order (no countdown)
export default function TokenScreen({ token, amount, paid, tableName, seconds = 0, onDone, doneLabel = "Done" }) {
  const [left, setLeft] = useState(seconds);

  // countdown only when `seconds` > 0 (kiosk)
  useEffect(() => {
    if (!seconds) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // fire onDone exactly when the countdown hits zero
  useEffect(() => {
    if (seconds && left <= 0) onDone();
  }, [left, seconds, onDone]);

  return (
    <div className="px-5 py-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-ok-soft flex items-center justify-center">
          <CircleCheck className="w-9 h-9 text-ok" />
        </div>
      </div>

      <div className="font-display text-ink font-semibold text-2xl">{paid ? "Payment received" : "Order placed"}</div>
      <p className="text-muted text-sm mt-1 mb-6">
        {paid ? "Your order is with the kitchen." : "Waiting for the restaurant to accept your order."}
      </p>

      <div className="rounded-3xl border-2 border-dashed border-accent bg-accent-soft py-6 px-4">
        <div className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Your token</div>
        <div className="font-mono text-accent font-bold leading-none mt-2 text-7xl">#{token ?? "-"}</div>
        <div className="text-muted text-xs mt-3">Keep this number handy — it's how we call your order</div>
      </div>

      <div className="mt-5 rounded-2xl bg-page border border-line p-4 text-left space-y-2">
        {tableName && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Table</span>
            <span className="text-ink font-semibold">{tableName}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted">{paid ? "Paid" : "Amount due"}</span>
          <span className="text-ink font-bold">₹{Number(amount || 0).toFixed(2)}</span>
        </div>
        {!paid && (
          <p className="text-muted text-xs leading-relaxed pt-2 border-t border-dashed border-line">
            Please pay cash to the staff at your table or at the counter. Your bill closes once payment is confirmed.
          </p>
        )}
      </div>

      <button onClick={onDone} className="w-full mt-6 py-4 rounded-2xl bg-accent text-white font-bold text-base active:bg-accent-hover">
        {seconds ? `Start new order (${Math.max(left, 0)}s)` : doneLabel}
      </button>
    </div>
  );
}