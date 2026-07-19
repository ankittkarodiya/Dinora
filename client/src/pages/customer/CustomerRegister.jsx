import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkPhoneApi, customerRegisterApi } from "../../api/customerAuthApi";
import { getMenuApi } from "../../api/publicApi";
import toast from "react-hot-toast";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [restaurant, setRestaurant] = useState(null);

  const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

  // fetch the restaurant's name/logo so this screen feels like it
  // belongs to them, not to the platform behind it
  useEffect(() => {
    const slug = sessionStorage.getItem("menuRestaurantSlug");
    const tableId = sessionStorage.getItem("menuTableId");
    if (!slug || !tableId) return;
    getMenuApi(slug, tableId)
      .then((data) => setRestaurant(data.restaurant))
      .catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (phone.length !== 10 || !username.trim()) {
      toast.error("Enter your name and a valid 10-digit phone number");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const check = await checkPhoneApi(phone, restaurantId);
      if (check.exists) {
        setPhoneError("Already registered. Please login instead.");
        setLoading(false);
        return;
      }
      const data = await customerRegisterApi({ phone, username: username.trim(), restaurantId });
      if (data.success) {
        sessionStorage.setItem("customerToken", data.token);
        toast.success(`Welcome, ${data.customer.username}!`);
        const returnUrl = sessionStorage.getItem("menuReturnUrl");
        sessionStorage.removeItem("menuReturnUrl");
        navigate(returnUrl && returnUrl.startsWith("/menu/") ? returnUrl : "/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-[#232326] rounded-3xl border border-white/10 p-8 shadow-2xl">


        <h1 className="text-white font-bold text-2xl tracking-tight text-center">Create Account</h1>
        <p className="text-gray-500 text-sm mt-1.5 text-center">
          Join <span className="text-[#FC8019] font-semibold">{restaurant?.name || "us!"}</span> to rate dishes and track orders
        </p>

        <div className="space-y-3 mt-7">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-[#FC8019]/40 text-base"
            autoFocus
          />

          <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/40">
            <span className="px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
              placeholder="Phone number"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
            />
          </div>

          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-300 text-xs leading-relaxed text-justify">
              Please double-check your phone number before continuing. Since we don't verify it, entering the wrong number means you'll permanently lose access to your order history, reviews, and tracking — with no way to recover them.
            </p>
          </div>

          {phoneError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
              <span>{phoneError}</span>
              {phoneError.includes("login") && (
                <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-bold ml-2 shrink-0">Login →</button>
              )}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || phone.length !== 10 || !username.trim()}
            className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-semibold">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

























// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { checkPhoneApi, customerRegisterApi } from "../../api/customerAuthApi";
// import toast from "react-hot-toast";

// export default function CustomerRegister() {
//   const navigate = useNavigate();
//   const [phone, setPhone] = useState("");
//   const [username, setUsername] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [phoneError, setPhoneError] = useState("");

//   const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

//   const handleRegister = async () => {
//     if (phone.length !== 10 || !username.trim()) {
//       toast.error("Enter your name and a valid 10-digit phone number");
//       return;
//     }
//     setPhoneError("");
//     setLoading(true);

//     try {
//       // still check first, so we can show a friendly "already registered" message
//       const check = await checkPhoneApi(phone, restaurantId);
//       if (check.exists) {
//         setPhoneError("Already registered. Please login instead.");
//         setLoading(false);
//         return;
//       }

//       const data = await customerRegisterApi({ phone, username: username.trim(), restaurantId });
//       if (data.success) {
//         sessionStorage.setItem("customerToken", data.token);
//         toast.success(`Welcome, ${data.customer.username}!`);
//         const returnUrl = sessionStorage.getItem("menuReturnUrl");
//         sessionStorage.removeItem("menuReturnUrl");
//         navigate(returnUrl && returnUrl.startsWith("/menu/") ? returnUrl : "/");
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#1C1C1E] flex flex-col justify-end">

//       <div className="flex-1 flex flex-col items-center justify-end pb-8 pt-16">
//         <div className="text-5xl mb-3">🍽️</div>
//         <h1 className="text-white font-bold text-2xl">Create Account</h1>
//         <p className="text-gray-500 text-sm mt-1">Join to rate dishes and track orders</p>
//       </div>
      

//       <div className="bg-[#2C2C2E] rounded-t-3xl px-5 pt-6 pb-10 max-w-120 w-full mx-auto">
//         <div className="space-y-3">
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             placeholder="Your name"
//             className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-[#FC8019]/40 text-base"
//             autoFocus
//           />

//           <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/40">
//             <span className="px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">+91</span>
//             <input
//               type="tel"
//               value={phone}
//               onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
//               placeholder="Phone number"
//               onKeyDown={(e) => e.key === "Enter" && handleRegister()}
//               className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
//             />
//           </div>


//            {/* ← NEW — warning about entering the correct number */}
//   {/* <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//       <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
//     </svg>
//     <p className="text-amber-300 text-xs leading-relaxed">
//       Please double-check your phone number before continuing. Since we don't verify it, entering the wrong number means you'll permanently lose access to your order history, reviews, and tracking — with no way to recover them.
//     </p>
//   </div> */}
//             <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
//   <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
//   </svg>
//   <p className="text-amber-300 text-xs leading-relaxed text-justify">
//     Please double-check your phone number before continuing. Since we don't verify it, entering the wrong number means you'll permanently lose access to your order history, reviews, and tracking — with no way to recover them.
//   </p>
// </div>

//           {phoneError && (
//             <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
//               <span>{phoneError}</span>
//               {phoneError.includes("login") && (
//                 <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-bold ml-2 shrink-0">
//                   Login →
//                 </button>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleRegister}
//             disabled={loading || phone.length !== 10 || !username.trim()}
//             className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
//           >
//             {loading ? "Creating Account..." : "Create Account"}
//           </button>

//           <div className="text-center text-gray-500 text-sm">
//             Already have an account?{" "}
//             <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-semibold">
//               Login
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

























// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../../config/firebase";
// import { verifyFirebasePhoneApi } from "../../api/customerAuthApi";
// import toast from "react-hot-toast";

// export default function CustomerRegister() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState("form"); // form → otp
//   const [phone, setPhone] = useState("");
//   const [username, setUsername] = useState("");
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [loading, setLoading] = useState(false);
//   const [confirmationResult, setConfirmationResult] = useState(null);
//   const recaptchaRef = useRef(null);

//   const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

//   useEffect(() => {
//     if (!recaptchaRef.current) {
//       recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container-register", {
//         size: "invisible",
//       });
//     }
//   }, []);

//   const handleSendOtp = async () => {
//     if (phone.length !== 10 || !username.trim()) return;
//     setLoading(true);
//     try {
//       const formattedPhone = `+91${phone}`;
//       const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current);
//       setConfirmationResult(result);
//       setStep("otp");
//       toast.success("OTP sent!");
//     } catch (error) {
//       console.error("Firebase send OTP error:", error);
//       toast.error(error.message || "Failed to send OTP");
//       recaptchaRef.current?.render().then((widgetId) => {
//         window.grecaptcha?.reset(widgetId);
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOtpChange = (index, value) => {
//     if (!/^\d?$/.test(value)) return;
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     if (value && index < 5) document.getElementById(`reg-otp-${index + 1}`)?.focus();
//   };

//   const otpValue = otp.join("");

//   const handleVerifyOtp = async () => {
//     if (otpValue.length !== 6 || !confirmationResult) return;
//     setLoading(true);
//     try {
//       const result = await confirmationResult.confirm(otpValue);
//       const firebaseIdToken = await result.user.getIdToken();

//       // registration path — includes the username so the backend can
//       // create a new Customer record on first-time signup
//       const data = await verifyFirebasePhoneApi({
//         idToken: firebaseIdToken,
//         restaurantId,
//         username: username.trim(),
//       });

//       if (data.success) {
//         sessionStorage.setItem("customerToken", data.token);
//         toast.success(`Welcome, ${data.customer.username}!`);
//         const returnUrl = sessionStorage.getItem("menuReturnUrl");
//         sessionStorage.removeItem("menuReturnUrl");
//         navigate(returnUrl && returnUrl.startsWith("/menu/") ? returnUrl : "/");
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       console.error("Verify error:", error);
//       toast.error("Incorrect OTP. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#1C1C1E] flex flex-col justify-end">
//       <div id="recaptcha-container-register"></div>

//       <div className="flex-1 flex flex-col items-center justify-end pb-8 pt-16">
//         <div className="text-5xl mb-3">🍽️</div>
//         <h1 className="text-white font-bold text-2xl">
//           {step === "form" ? "Create Account" : "Verify OTP"}
//         </h1>
//       </div>

//       <div className="bg-[#2C2C2E] rounded-t-3xl px-5 pt-6 pb-10 max-w-120 w-full mx-auto">
//         {step === "form" && (
//           <div className="space-y-3">
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Your name"
//               className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-4 text-white placeholder-gray-600 outline-none text-base"
//               autoFocus
//             />
//             <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5">
//               <span className="px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">+91</span>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
//                 placeholder="Phone number"
//                 className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
//               />
//             </div>
//             <button
//               onClick={handleSendOtp}
//               disabled={loading || phone.length !== 10 || !username.trim()}
//               className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
//             >
//               {loading ? "Sending..." : "Get OTP"}
//             </button>
//           </div>
//         )}

//         {step === "otp" && (
//           <div className="space-y-5">
//             <div className="flex gap-2 justify-center">
//               {otp.map((digit, i) => (
//                 <input
//                   key={i}
//                   id={`reg-otp-${i}`}
//                   type="text"
//                   inputMode="numeric"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) => handleOtpChange(i, e.target.value)}
//                   className={`w-12 h-14 text-center text-white text-xl font-bold rounded-xl border-2 outline-none bg-[#1C1C1E] ${digit ? "border-[#FC8019]" : "border-white/10"}`}
//                   autoFocus={i === 0}
//                 />
//               ))}
//             </div>
//             <button
//               onClick={handleVerifyOtp}
//               disabled={loading || otpValue.length !== 6}
//               className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl disabled:opacity-40"
//             >
//               {loading ? "Verifying..." : "Create Account"}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

























// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, Link } from "react-router-dom";
// import {
//   sendCustomerOtp, registerCustomer, clearCustomerError,
//   resetOtpState, selectCurrentCustomer, selectCustomerLoading,
//   selectCustomerError, selectOtpSent,
// } from "../../features/customerAuth/customerAuthSlice";
// import { checkPhoneApi } from "../../api/customerAuthApi";

// export default function CustomerRegister() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const currentCustomer = useSelector(selectCurrentCustomer);
//   const loading = useSelector(selectCustomerLoading);
//   const error = useSelector(selectCustomerError);
//   const otpSent = useSelector(selectOtpSent);

//   const [step, setStep] = useState("form");
//   const [phone, setPhone] = useState("");
//   const [username, setUsername] = useState("");
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [resendTimer, setResendTimer] = useState(0);
//   const [checkingPhone, setCheckingPhone] = useState(false);
//   const [phoneError, setPhoneError] = useState("");

//   const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

//   useEffect(() => {
//     if (currentCustomer) {
//       const returnUrl = sessionStorage.getItem("menuReturnUrl");
//       sessionStorage.removeItem("menuReturnUrl");
//       sessionStorage.removeItem("menuRestaurantId");

//       if (returnUrl && returnUrl.startsWith("/menu/")) {
//         navigate(returnUrl, { replace: true });
//       } 
//       else if(window.history.length > 2) {
//         navigate(-1);
//       }
//     //   else {
//     //     navigate("/", { replace: true });
//     //   }
//     }
//   }, [currentCustomer, navigate]);

//   useEffect(() => {
//     if (otpSent) {
//       setStep("otp");
//       setResendTimer(30);
//     }
//   }, [otpSent]);

//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
//     return () => clearInterval(t);
//   }, [resendTimer]);

//   const handleSendOtp = async () => {
//     if (phone.length !== 10 || !username.trim()) return;
//     setPhoneError("");
//     setCheckingPhone(true);
//     try {
//       const data = await checkPhoneApi(phone, restaurantId);
//       if (data.exists) {
//         setPhoneError("Already registered. Please login instead.");
//         return;
//       }
//       dispatch(clearCustomerError());
//       dispatch(sendCustomerOtp(phone));
//     } catch {
//       setPhoneError("Something went wrong. Try again.");
//     } finally {
//       setCheckingPhone(false);
//     }
//   };

//   const handleOtpChange = (index, value) => {
//     if (!/^\d?$/.test(value)) return;
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     if (value && index < 5) {
//       document.getElementById(`reg-otp-${index + 1}`)?.focus();
//     }
//   };

//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       document.getElementById(`reg-otp-${index - 1}`)?.focus();
//     }
//     if (e.key === "Enter") handleRegister();
//   };

//   const handleOtpPaste = (e) => {
//     e.preventDefault();
//     const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
//     const newOtp = ["", "", "", "", "", ""];
//     text.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
//     setOtp(newOtp);
//     document.getElementById(`reg-otp-${Math.min(text.length, 5)}`)?.focus();
//   };

//   const otpValue = otp.join("");

//   const handleRegister = () => {
//     if (otpValue.length !== 6 || !username.trim() || loading) return;
//     dispatch(clearCustomerError());
//     dispatch(registerCustomer({
//       phone,
//       otp: otpValue,
//       username: username.trim(),
//       restaurantId,
//     }));
//   };

//   const handleBack = () => {
//     setStep("form");
//     setOtp(["", "", "", "", "", ""]);
//     setPhoneError("");
//     dispatch(resetOtpState());
//     dispatch(clearCustomerError());
//   };

//   const handleResend = () => {
//     if (resendTimer > 0 || loading) return;
//     setOtp(["", "", "", "", "", ""]);
//     dispatch(clearCustomerError());
//     dispatch(sendCustomerOtp(phone));
//   };

//   return (
//     <div className="min-h-screen bg-[#1C1C1E] flex flex-col justify-end">

//       {/* Top area */}
//       <div className="flex-1 flex flex-col items-center justify-end pb-8 pt-16 px-4">
//         <div className="text-5xl mb-4">🍽️</div>
//         <h1 className="text-white font-bold text-2xl text-center">
//           {step === "form" ? "Create Account" : "Verify OTP"}
//         </h1>
//         <p className="text-gray-500 text-sm mt-1 text-center">
//           {step === "form"
//             ? "Register to rate dishes and track your orders"
//             : `We sent a 6-digit code to +91 ${phone}`
//           }
//         </p>
//       </div>

//       {/* Bottom sheet */}
//       <div className="bg-[#2C2C2E] rounded-t-3xl px-5 pt-6 pb-10 max-w-120 w-full mx-auto">

//         {step === "form" && (
//           <div className="space-y-3">
//             {/* Name */}
//             <input
//               type="text"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Your name"
//               className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-4.5 text-white placeholder-gray-600 outline-none focus:border-[#FC8019]/60 text-base transition-colors"
//               autoFocus
//             />

//             {/* Phone */}
//             <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/60 transition-colors">
//               <span className="px-4 py-4.5 text-gray-400 text-sm font-bold border-r border-white/10 shrink-0">
//                 +91
//               </span>
//               <input
//                 type="tel"
//                 value={phone}
//                 onChange={(e) => {
//                   setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
//                   setPhoneError("");
//                 }}
//                 onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
//                 placeholder="Phone number"
//                 className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4.5 text-xl tracking-[0.2em] font-medium"
//               />
//             </div>

//             {phoneError && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
//                 <span>{phoneError}</span>
//                 {phoneError.includes("login") && (
//                   <button
//                     onClick={() => navigate("/customer/login")}
//                     className="text-[#FC8019] font-bold ml-2 shrink-0"
//                   >
//                     Login →
//                   </button>
//                 )}
//               </div>
//             )}

//             {error && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
//                 {error}
//               </div>
//             )}

//             <button
//               onClick={handleSendOtp}
//               disabled={loading || checkingPhone || phone.length !== 10 || !username.trim()}
//               className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
//             >
//               {checkingPhone ? "Checking..." : loading ? "Sending OTP..." : "Get OTP"}
//             </button>

//             <div className="text-center text-gray-500 text-sm">
//               Already have an account?{" "}
//               <button
//                 onClick={() => navigate("/customer/login")}
//                 className="text-[#FC8019] font-semibold"
//               >
//                 Login
//               </button>
//             </div>
//           </div>
//         )}

//         {step === "otp" && (
//           <div className="space-y-5">
//             {/* Name preview */}
//             <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-xl px-4 py-2.5">
//               <span className="text-gray-500 text-xs">Registering as</span>
//               <span className="text-white text-sm font-semibold">{username}</span>
//             </div>

//             {/* OTP boxes */}
//             <div className="flex gap-2 justify-center py-2">
//               {otp.map((digit, i) => (
//                 <input
//                   key={i}
//                   id={`reg-otp-${i}`}
//                   type="text"
//                   inputMode="numeric"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) => handleOtpChange(i, e.target.value)}
//                   onKeyDown={(e) => handleOtpKeyDown(i, e)}
//                   onPaste={i === 0 ? handleOtpPaste : undefined}
//                   className={`w-12 h-14 text-center text-white text-2xl font-bold rounded-2xl border-2 outline-none bg-[#1C1C1E] transition-all
//                     ${digit
//                       ? "border-[#FC8019] bg-[#FC8019]/10"
//                       : "border-white/10 focus:border-[#FC8019]/50"
//                     }`}
//                   autoFocus={i === 0}
//                 />
//               ))}
//             </div>

//             {error && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
//                 {error}
//               </div>
//             )}

//             <button
//               onClick={handleRegister}
//               disabled={loading || otpValue.length !== 6}
//               className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
//             >
//               {loading ? "Creating Account..." : "Create Account"}
//             </button>

//             <div className="flex justify-between items-center">
//               <button onClick={handleBack} className="text-gray-500 text-sm">
//                 ← Change details
//               </button>
//               <button
//                 onClick={handleResend}
//                 disabled={resendTimer > 0 || loading}
//                 className="text-[#FC8019] text-sm font-semibold disabled:opacity-40"
//               >
//                 {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }