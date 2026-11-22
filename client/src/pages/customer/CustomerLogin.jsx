// light theme
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkPhoneApi, customerLoginApi } from "../../api/customerAuthApi";
import toast from "react-hot-toast";

export default function CustomerLogin() {
  const navigate = useNavigate();

  const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleLogin = async () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const check = await checkPhoneApi(phone, restaurantId);
      if (!check.exists) {
        setPhoneError("Not registered. Please register first.");
        setLoading(false);
        return;
      }
      const data = await customerLoginApi({ phone, restaurantId });
      if (data.success) {
        sessionStorage.setItem("customerToken", data.token);
        toast.success(`Welcome back, ${data.customer.username}!`);
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

        <h1 className="text-stone-900 font-bold text-2xl tracking-tight text-center">Welcome back</h1>
        <p className="text-stone-500 text-sm mt-1.5 text-center">
          Login with your phone number to rate dishes and track orders
        </p>

        <div className="space-y-3 mt-7">

          
          {/* <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/40">
            <span className="px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">+91</span>
            <span className="shrink-0 w-16 text-center px-3 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">
              +91
            </span>
            <input
              type="tel"

              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"

              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
              placeholder="Phone number"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
              autoFocus
            />
          </div> */}
          <div className="flex items-center bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 focus-within:border-accent/40">
  <div className="flex-none min-w-16 px-4 py-4 text-stone-400 text-sm font-semibold border-r border-stone-200 text-center">
    +91
  </div>

  <input
    type="tel"
    inputMode="numeric"
    value={phone}
    onChange={(e) => {
      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
      setPhoneError("");
    }}
    placeholder="Phone number"
    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
    className="min-w-0 flex-1 bg-transparent text-stone-900 placeholder-stone-400 outline-none px-4 py-4 text-lg tracking-widest"
    autoFocus
  />
</div>

          {phoneError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center justify-between">
              <span>{phoneError}</span>
              {phoneError.includes("register") && (
                <button
                  onClick={() => navigate("/customer/register")}
                  className="text-accent font-bold ml-2 shrink-0"
                >
                  Register →
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || phone.length !== 10}
            className="w-full bg-accent text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform hover:bg-[#a93b0c]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-stone-500 text-sm">
            New here?{" "}
            <button
              onClick={() => navigate("/customer/register")}
              className="text-accent font-semibold"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







































// dark theme
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { checkPhoneApi, customerLoginApi } from "../../api/customerAuthApi";
// import toast from "react-hot-toast";

// export default function CustomerLogin() {
//   const navigate = useNavigate();

//   const restaurantId = sessionStorage.getItem("menuRestaurantId") || undefined;

//   const [phone, setPhone] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [phoneError, setPhoneError] = useState("");

//   const handleLogin = async () => {
//     if (phone.length !== 10) {
//       toast.error("Enter a valid 10-digit phone number");
//       return;
//     }
//     setPhoneError("");
//     setLoading(true);
//     try {
//       const check = await checkPhoneApi(phone, restaurantId);
//       if (!check.exists) {
//         setPhoneError("Not registered. Please register first.");
//         setLoading(false);
//         return;
//       }
//       const data = await customerLoginApi({ phone, restaurantId });
//       if (data.success) {
//         sessionStorage.setItem("customerToken", data.token);
//         toast.success(`Welcome back, ${data.customer.username}!`);
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

//         <h1 className="text-white font-bold text-2xl tracking-tight text-center">Welcome back</h1>
//         <p className="text-gray-500 text-sm mt-1.5 text-center">
//           Login with your phone number to rate dishes and track orders
//         </p>

//         <div className="space-y-3 mt-7">

          
//           {/* <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/40">
//             <span className="px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">+91</span>
//             <span className="shrink-0 w-16 text-center px-3 py-4 text-gray-400 text-sm font-semibold border-r border-white/10">
//               +91
//             </span>
//             <input
//               type="tel"

//               inputMode="numeric"
//               pattern="[0-9]*"
//               autoComplete="tel-national"

//               value={phone}
//               onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }}
//               placeholder="Phone number"
//               onKeyDown={(e) => e.key === "Enter" && handleLogin()}
//               className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
//               autoFocus
//             />
//           </div> */}
//           <div className="flex items-center bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/5 focus-within:border-[#FC8019]/40">
//   <div className="flex-none min-w-16 px-4 py-4 text-gray-400 text-sm font-semibold border-r border-white/10 text-center">
//     +91
//   </div>

//   <input
//     type="tel"
//     inputMode="numeric"
//     value={phone}
//     onChange={(e) => {
//       setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
//       setPhoneError("");
//     }}
//     placeholder="Phone number"
//     onKeyDown={(e) => e.key === "Enter" && handleLogin()}
//     className="min-w-0 flex-1 bg-transparent text-white placeholder-gray-600 outline-none px-4 py-4 text-lg tracking-widest"
//     autoFocus
//   />
// </div>

//           {phoneError && (
//             <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
//               <span>{phoneError}</span>
//               {phoneError.includes("register") && (
//                 <button
//                   onClick={() => navigate("/customer/register")}
//                   className="text-[#FC8019] font-bold ml-2 shrink-0"
//                 >
//                   Register →
//                 </button>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleLogin}
//             disabled={loading || phone.length !== 10}
//             className="w-full bg-[#FC8019] text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
//           >
//             {loading ? "Logging in..." : "Login"}
//           </button>

//           <div className="text-center text-gray-500 text-sm">
//             New here?{" "}
//             <button
//               onClick={() => navigate("/customer/register")}
//               className="text-[#FC8019] font-semibold"
//             >
//               Create account
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }