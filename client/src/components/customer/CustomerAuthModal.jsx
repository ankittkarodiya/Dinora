export default function CustomerAuthModal({ onClose, onLoginClick, onRegisterClick }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/85 z-200 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#2C2C2E] rounded-t-3xl p-5 pb-10 shadow-2xl"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-white font-bold text-lg">Login to Rate</h2>
          <p className="text-gray-400 text-sm mt-1">
            Login to rate dishes and write reviews
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onLoginClick}
            className="w-full py-4 rounded-2xl bg-[#FC8019] text-white font-bold text-base"
          >
            Login
          </button>
          <button
            onClick={onRegisterClick}
            className="w-full py-4 rounded-2xl bg-white/10 text-gray-300 font-semibold text-base"
          >
            Create Account
          </button>
          <button onClick={onClose} className="w-full text-gray-600 text-sm py-2">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

























// import { useNavigate, useLocation } from "react-router-dom";

// export default function CustomerAuthModal({ onClose, restaurantId }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const goTo = (path) => {
//     // save return URL to sessionStorage as a reliable backup
//     if (location.pathname.startsWith("/menu/")) {
//       sessionStorage.setItem("customerReturnUrl", location.pathname);
//     }
//     navigate(path, {
//       state: { from: location.pathname, restaurantId },
//     });
//     onClose();
//   };

//   return (
//     <div
//       onClick={onClose}
//       className="fixed inset-0 bg-black/85 z-200 flex items-end justify-center"
//     >
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
//             onClick={() => goTo("/customer/login")}
//             className="w-full py-4 rounded-2xl bg-[#FC8019] text-white font-bold"
//           >
//             Login
//           </button>
//           <button
//             onClick={() => goTo("/customer/register")}
//             className="w-full py-4 rounded-2xl bg-white/10 text-gray-300 font-semibold"
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






























// // import { useNavigate, useLocation } from "react-router-dom";

// // export default function CustomerAuthModal({ onClose }) {
// //   const navigate = useNavigate();
// //   const location = useLocation();

// //   const goTo = (path) => {
// //     navigate(path, { state: { from: location.pathname } });
// //     onClose();
// //   };

// //   return (
// //     <div
// //       onClick={onClose}
// //       className="fixed inset-0 bg-black/85 z-200 flex items-center justify-center p-4"
// //     >
// //       <div
// //         onClick={(e) => e.stopPropagation()}
// //         className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl"
// //       >
// //         <div className="text-center mb-6">
// //           <div className="text-5xl mb-4">⭐</div>
// //           <h2 className="text-white font-bold text-xl">Rate this dish</h2>
// //           <p className="text-slate-300 text-sm mt-2">
// //             Login or create a free account to rate dishes and write reviews
// //           </p>
// //         </div>

// //         <div className="space-y-3">
// //           <button
// //             onClick={() => goTo("/customer/login")}
// //             className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
// //           >
// //             Login
// //           </button>
// //           <button
// //             onClick={() => goTo("/customer/register")}
// //             className="w-full rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5"
// //           >
// //             Create Account
// //           </button>
// //           <button
// //             onClick={onClose}
// //             className="w-full text-slate-400 text-sm py-2 hover:text-slate-300 transition-colors"
// //           >
// //             Maybe later
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }















// // // import { useState, useEffect } from "react";
// // // import { useDispatch, useSelector } from "react-redux";
// // // import {
// // //   sendCustomerOtp,
// // //   verifyCustomerOtp,
// // //   updateCustomerProfile,
// // //   clearCustomerError,
// // //   resetOtpState,
// // //   selectCurrentCustomer,
// // //   selectCustomerLoading,
// // //   selectCustomerError,
// // //   selectOtpSent,
// // //   selectIsNewCustomer,
// // // } from "../../features/customerAuth/customerAuthSlice";

// // // export default function CustomerAuthModal({ onClose, onSuccess }) {
// // //   const dispatch = useDispatch();

// // //   const currentCustomer = useSelector(selectCurrentCustomer);
// // //   const loading = useSelector(selectCustomerLoading);
// // //   const error = useSelector(selectCustomerError);
// // //   const otpSent = useSelector(selectOtpSent);
// // //   const isNewCustomer = useSelector(selectIsNewCustomer);

// // //   const [phone, setPhone] = useState("");
// // //   const [otp, setOtp] = useState("");
// // //   const [username, setUsername] = useState("");
// // //   const [step, setStep] = useState("phone"); // phone | otp | name
// // //   const [resendTimer, setResendTimer] = useState(0);

// // //   // move to otp step when OTP is sent
// // //   useEffect(() => {
// // //     if (otpSent) {
// // //       setStep("otp");
// // //       // start 30s resend timer
// // //       setResendTimer(30);
// // //     }
// // //   }, [otpSent]);

// // //   // resend timer countdown
// // //   useEffect(() => {
// // //     if (resendTimer <= 0) return;
// // //     const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
// // //     return () => clearInterval(t);
// // //   }, [resendTimer]);

// // //   // on successful login
// // //   useEffect(() => {
// // //     if (currentCustomer && !isNewCustomer) {
// // //       onSuccess?.();
// // //     }
// // //     if (currentCustomer && isNewCustomer) {
// // //       setStep("name");
// // //     }
// // //   }, [currentCustomer, isNewCustomer]);

// // //   const handleSendOtp = () => {
// // //     if (phone.length !== 10) return;
// // //     dispatch(clearCustomerError());
// // //     dispatch(sendCustomerOtp(phone));
// // //   };

// // //   const handleVerifyOtp = () => {
// // //     if (otp.length !== 6) return;
// // //     dispatch(clearCustomerError());
// // //     dispatch(verifyCustomerOtp({ phone, otp }));
// // //   };

// // //   const handleResendOtp = () => {
// // //     setOtp("");
// // //     dispatch(clearCustomerError());
// // //     dispatch(sendCustomerOtp(phone));
// // //   };

// // //   const handleSaveName = async () => {
// // //     if (!username.trim()) return;
// // //     await dispatch(updateCustomerProfile(username.trim()));
// // //     onSuccess?.();
// // //   };

// // //   const handleBack = () => {
// // //     setStep("phone");
// // //     setOtp("");
// // //     dispatch(resetOtpState());
// // //     dispatch(clearCustomerError());
// // //   };

// // //   return (
// // //     <div
// // //       onClick={onClose}
// // //       className="fixed inset-0 bg-black/85 z-200 flex items-center justify-center p-4"
// // //     >
// // //       <div
// // //         onClick={(e) => e.stopPropagation()}
// // //         className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl"
// // //       >
// // //         {/* ── Step 1: Enter Phone ───────────────── */}
// // //         {step === "phone" && (
// // //           <>
// // //             <div className="text-center mb-6">
// // //               <div className="text-5xl mb-3">📱</div>
// // //               <h2 className="text-white font-bold text-xl">Login to Rate</h2>
// // //               <p className="text-slate-300 text-sm mt-1">
// // //                 Enter your phone number to get started
// // //               </p>
// // //             </div>

// // //             <div className="space-y-4">
// // //               <div>
// // //                 <label className="block text-white mb-2 text-sm font-medium">
// // //                   Phone Number
// // //                 </label>
// // //                 <div className="flex rounded-xl border border-white/20 bg-white/10 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
// // //                   <span className="px-3 py-3 text-slate-300 text-sm border-r border-white/20 bg-white/5 font-semibold">
// // //                     +91
// // //                   </span>
// // //                   <input
// // //                     type="tel"
// // //                     value={phone}
// // //                     onChange={(e) =>
// // //                       setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
// // //                     }
// // //                     placeholder="9876543210"
// // //                     className="flex-1 px-3 py-3 text-white placeholder-slate-400 outline-none bg-transparent text-lg tracking-wide"
// // //                     onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
// // //                   />
// // //                 </div>
// // //               </div>

// // //               {error && (
// // //                 <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
// // //                   {error}
// // //                 </div>
// // //               )}

// // //               <button
// // //                 onClick={handleSendOtp}
// // //                 disabled={loading || phone.length !== 10}
// // //                 className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
// // //               >
// // //                 {loading ? "Sending OTP..." : "Send OTP →"}
// // //               </button>

// // //               <button
// // //                 onClick={onClose}
// // //                 className="w-full text-slate-400 text-sm py-2 hover:text-slate-300 transition-colors"
// // //               >
// // //                 Maybe later
// // //               </button>
// // //             </div>
// // //           </>
// // //         )}

// // //         {/* ── Step 2: Enter OTP ─────────────────── */}
// // //         {step === "otp" && (
// // //           <>
// // //             <div className="text-center mb-6">
// // //               <div className="text-5xl mb-3">🔐</div>
// // //               <h2 className="text-white font-bold text-xl">Enter OTP</h2>
// // //               <p className="text-slate-300 text-sm mt-1">
// // //                 Sent to <span className="text-white font-semibold">+91 {phone}</span>
// // //               </p>
// // //             </div>

// // //             <div className="space-y-4">
// // //               <div>
// // //                 <label className="block text-white mb-2 text-sm font-medium">
// // //                   6-digit OTP
// // //                 </label>
// // //                 <input
// // //                   type="text"
// // //                   value={otp}
// // //                   onChange={(e) =>
// // //                     setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
// // //                   }
// // //                   placeholder="• • • • • •"
// // //                   maxLength={6}
// // //                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-4 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-center text-3xl font-bold tracking-[0.5em]"
// // //                   onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
// // //                 />
// // //               </div>

// // //               {error && (
// // //                 <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
// // //                   {error}
// // //                 </div>
// // //               )}

// // //               <button
// // //                 onClick={handleVerifyOtp}
// // //                 disabled={loading || otp.length !== 6}
// // //                 className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
// // //               >
// // //                 {loading ? "Verifying..." : "Verify OTP →"}
// // //               </button>

// // //               <div className="flex items-center justify-between">
// // //                 <button
// // //                   onClick={handleBack}
// // //                   className="text-slate-400 text-sm hover:text-slate-300 transition-colors"
// // //                 >
// // //                   ← Change number
// // //                 </button>
// // //                 <button
// // //                   onClick={handleResendOtp}
// // //                   disabled={resendTimer > 0 || loading}
// // //                   className="text-blue-400 text-sm hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
// // //                 >
// // //                   {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </>
// // //         )}

// // //         {/* ── Step 3: New user — set name ───────── */}
// // //         {step === "name" && (
// // //           <>
// // //             <div className="text-center mb-6">
// // //               <div className="text-5xl mb-3">👋</div>
// // //               <h2 className="text-white font-bold text-xl">Welcome!</h2>
// // //               <p className="text-slate-300 text-sm mt-1">
// // //                 What should we call you?
// // //               </p>
// // //             </div>

// // //             <div className="space-y-4">
// // //               <div>
// // //                 <label className="block text-white mb-2 text-sm font-medium">
// // //                   Your Name
// // //                 </label>
// // //                 <input
// // //                   type="text"
// // //                   value={username}
// // //                   onChange={(e) => setUsername(e.target.value)}
// // //                   placeholder="e.g. Ankit"
// // //                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
// // //                   onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
// // //                 />
// // //               </div>

// // //               <button
// // //                 onClick={handleSaveName}
// // //                 disabled={!username.trim() || loading}
// // //                 className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
// // //               >
// // //                 {loading ? "Saving..." : "Continue →"}
// // //               </button>

// // //               <button
// // //                 onClick={() => onSuccess?.()}
// // //                 className="w-full text-slate-400 text-sm py-2 hover:text-slate-300 transition-colors"
// // //               >
// // //                 Skip for now
// // //               </button>
// // //             </div>
// // //           </>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // }