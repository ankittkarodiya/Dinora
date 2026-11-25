import { useState } from "react";
import { X, CircleCheck } from "lucide-react";
import toast from "react-hot-toast";
import { createDemoRequestApi } from "../../api/demoApi";

const EMPTY = { name: "", restaurantName: "", phone: "", email: "", city: "", message: "", website: "" };

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600";

export default function DemoModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const close = () => {
    if (sending) return;
    onClose();
    // reset after the close animation so the next open starts fresh
    setTimeout(() => {
      setForm(EMPTY);
      setDone(false);
    }, 200);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const phone = form.phone.replace(/\D/g, "").slice(-10);
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!form.restaurantName.trim()) return toast.error("Please enter your restaurant name");
    if (phone.length !== 10) return toast.error("Enter a valid 10-digit phone number");

    setSending(true);
    try {
      await createDemoRequestApi({ ...form, phone });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-100 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Book a free demo
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Tell us a little about your restaurant and we will call you to show Dinora live.
            </p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CircleCheck className="w-14 h-14 text-green-600 mx-auto" />
            <h4 className="mt-4 text-xl font-bold text-gray-900">Request received</h4>
            <p className="mt-2 text-gray-600 text-sm">
              Thank you, {form.name.trim().split(" ")[0]}. We will call you on {form.phone} within one working day.
            </p>
            <button
              onClick={close}
              className="mt-6 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm cursor-pointer transition-all duration-150"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 pt-4 space-y-3">
            {/* honeypot: real people never see or fill this, bots do */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={set("website")}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Your name *" value={form.name} onChange={set("name")} />
              <input
                className={inputCls}
                placeholder="Restaurant name *"
                value={form.restaurantName}
                onChange={set("restaurantName")}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className={inputCls}
                placeholder="Phone number *"
                inputMode="numeric"
                maxLength={14}
                value={form.phone}
                onChange={set("phone")}
              />
              <input
                className={inputCls}
                placeholder="Email (optional)"
                type="email"
                value={form.email}
                onChange={set("email")}
              />
            </div>
            <input className={inputCls} placeholder="City (optional)" value={form.city} onChange={set("city")} />
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Anything you'd like us to know? (optional)"
              value={form.message}
              onChange={set("message")}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm cursor-pointer transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Request my demo"}
            </button>
            <p className="text-xs text-gray-400 text-center">We only use these details to contact you about Dinora.</p>
          </form>
        )}
      </div>
    </div>
  );
}