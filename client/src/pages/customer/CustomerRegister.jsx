// light theme
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
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 p-8 shadow-2xl">


        <h1 className="text-stone-900 font-bold text-2xl tracking-tight text-center">Create Account</h1>
        <p className="text-stone-500 text-sm mt-1.5 text-center">
          Join <span className="text-accent font-semibold">{restaurant?.name || "us!"}</span> to rate dishes and track orders
        </p>

        <div className="space-y-3 mt-7">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-stone-900 placeholder-stone-400 outline-none focus:border-accent/40 text-base"
            autoFocus
          />

          <div className="flex items-center bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 focus-within:border-accent/40">
            <span className="px-4 py-4 text-stone-400 text-sm font-semibold border-r border-stone-200">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
              placeholder="Phone number"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="flex-1 bg-transparent text-stone-900 placeholder-stone-400 outline-none px-4 py-4 text-lg tracking-widest"
            />
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-amber-700 text-xs leading-relaxed text-justify">
              Please double-check your phone number before continuing. Since we don't verify it, entering the wrong number means you'll permanently lose access to your order history, reviews, and tracking — with no way to recover them.
            </p>
          </div>

          {phoneError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center justify-between">
              <span>{phoneError}</span>
              {phoneError.includes("login") && (
                <button onClick={() => navigate("/customer/login")} className="text-accent font-bold ml-2 shrink-0">Login →</button>
              )}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || phone.length !== 10 || !username.trim()}
            className="w-full bg-accent text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform hover:bg-[#a93b0c]"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center text-stone-500 text-sm">
            Already have an account?{" "}
            <button onClick={() => navigate("/customer/login")} className="text-accent font-semibold">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}







































// dark theme
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { checkPhoneApi, customerRegisterApi } from "../../api/customerAuthApi";
// import { getMenuApi } from "../../api/publicApi";
// import toast from "react-hot-toast";

// export default function CustomerRegister() {
//   const navigate = useNavigate();
//   const [phone, setPhone] = useState("");
//   const [username, setUsername] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [phoneError, setPhoneError] = useState("");
//   const [restaurant, setRestaurant] = useState(null);

//   const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

//   // fetch the restaurant's name/logo so this screen feels like it
//   // belongs to them, not to the platform behind it
//   useEffect(() => {
//     const slug = sessionStorage.getItem("menuRestaurantSlug");
//     const tableId = sessionStorage.getItem("menuTableId");
//     if (!slug || !tableId) return;
//     getMenuApi(slug, tableId)
//       .then((data) => setRestaurant(data.restaurant))
//       .catch(() => {});
//   }, []);

//   const handleRegister = async () => {
//     if (phone.length !== 10 || !username.trim()) {
//       toast.error("Enter your name and a valid 10-digit phone number");
//       return;
//     }
//     setPhoneError("");
//     setLoading(true);
//     try {
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
//     <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-6 py-10">
//       <div className="w-full max-w-sm bg-[#232326] rounded-3xl border border-white/10 p-8 shadow-2xl">


//         <h1 className="text-white font-bold text-2xl tracking-tight text-center">Create Account</h1>
//         <p className="text-gray-500 text-sm mt-1.5 text-center">
//           Join <span className="text-[#FC8019] font-semibold">{restaurant?.name || "us!"}</span> to rate dishes and track orders
//         </p>

//         <div className="space-y-3 mt-7">
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

//           <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
//             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
//             </svg>
//             <p className="text-amber-300 text-xs leading-relaxed text-justify">
//               Please double-check your phone number before continuing. Since we don't verify it, entering the wrong number means you'll permanently lose access to your order history, reviews, and tracking — with no way to recover them.
//             </p>
//           </div>

//           {phoneError && (
//             <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
//               <span>{phoneError}</span>
//               {phoneError.includes("login") && (
//                 <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-bold ml-2 shrink-0">Login →</button>
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
//             <button onClick={() => navigate("/customer/login")} className="text-[#FC8019] font-semibold">Login</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }