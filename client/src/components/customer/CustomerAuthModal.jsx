import { useState } from "react";
import { useDispatch } from "react-redux";
import { loginCustomer } from "../../features/customerAuth/customerAuthSlice";
import toast from "react-hot-toast";

export default function CustomerAuthModal({ restaurantId, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || submitting) return;
    setSubmitting(true);
    try {
      const customer = await dispatch(loginCustomer({ phone, restaurantId })).unwrap();
      toast.success(`Welcome back, ${customer.username}!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error || "Not registered yet — place an order first to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/85 z-200 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#2C2C2E] rounded-t-3xl p-5 pb-10 shadow-2xl"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-white font-bold text-lg">Login to Continue</h2>
          <p className="text-gray-400 text-sm mt-1">
            Enter the phone number you used when ordering
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 outline-none focus:border-[#FC8019]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#FC8019] text-white font-bold text-base disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Login"}
          </button>
          <button type="button" onClick={onClose} className="w-full text-gray-600 text-sm py-2">
            Maybe later
          </button>
        </form>
      </div>
    </div>
  );
}


























// export default function CustomerAuthModal({ onClose, onLoginClick, onRegisterClick }) {
//   return (
//     <div onClick={onClose} className="fixed inset-0 bg-black/85 z-200 flex items-end justify-center">
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="w-full max-w-120 bg-[#2C2C2E] rounded-t-3xl p-5 pb-10 shadow-2xl"
//       >
//         <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
//         <div className="text-center mb-6">
//           <div className="text-4xl mb-3">⭐</div>
//           <h2 className="text-white font-bold text-lg">Login to Rate</h2>
//           <p className="text-gray-400 text-sm mt-1">
//             Login to rate dishes and write reviews
//           </p>
//         </div>
//         <div className="space-y-3">
//           <button
//             onClick={onLoginClick}
//             className="w-full py-4 rounded-2xl bg-[#FC8019] text-white font-bold text-base"
//           >
//             Login
//           </button>
//           <button
//             onClick={onRegisterClick}
//             className="w-full py-4 rounded-2xl bg-white/10 text-gray-300 font-semibold text-base"
//           >
//             Create Account
//           </button>
//           <button onClick={onClose} className="w-full text-gray-600 text-sm py-2">
//             Maybe later
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }