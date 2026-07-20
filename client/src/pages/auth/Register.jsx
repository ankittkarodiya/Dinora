import { useState } from "react";
import { registerApi } from "../../api/authApi";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import PasswordInput from "../../components/common/PasswordInput";
function Register() {
  const navigate = useNavigate();
    
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "restaurant_admin",
  });
  const [creatingAccount, setCreatingAccount] = useState(false);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creatingAccount) return;
    setCreatingAccount(true);
    try {
      const data = await registerApi(formData);
      if (data.success) {
        toast.success(data.message);
        // localStorage.setItem("token", data.user.token);
        navigate("/register-verification");
        // navigate(`/verify-email/${formData.email}`);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
        // alert(error.response?.data?.message || "Something went wrong");
        toast.error(error.response?.data?.message || "Something went wrong");
        console.log(error.response?.data);
        console.error(error);
    } finally {
      setCreatingAccount(false);
    }
  };
return (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-6">
    <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center bg-linear-to-br from-blue-600 to-blue-800 p-12 text-white">
        <h1 className="text-5xl font-bold tracking-tight">
          Dinora
        </h1>
        <p className="mt-5 text-lg text-blue-100 leading-relaxed">
          Modern restaurant management made simple.
        </p>
        <div className="mt-12 space-y-6">
          <div className="flex items-start gap-3">
            <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
            <p className="text-blue-100">
              QR based ordering system
            </p>
          </div> 
          <div className="flex items-start gap-3">
            <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
            <p className="text-blue-100">
              Live kitchen & order tracking
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
            <p className="text-blue-100">
              Built for restaurants & customers
            </p>
          </div>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">
              Create account
            </h2>
            <p className="mt-2 text-slate-400">
              Join Dinora and start managing smarter.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <input
                type="text"
                name="username"
                placeholder="Ankit"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              {/* <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              /> */}
              {/* new with icons */}
              <PasswordInput
                // type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              >
                <option value="customer" className="text-black">
                  Customer
                </option>
                <option value="restaurant_admin" className="text-black">
                  Restaurant Admin
                </option>
              </select>
            </div> */}
            <button
              type="submit"
              disabled={creatingAccount}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingAccount ? "Creating Account..." : "Create Account"}
            </button>
              {/* google authentication */}
            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-900 px-4 text-sm text-slate-500">
                  Continue with
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                // window.open("http://localhost:3000/api/auth/google", "_self");
                window.location.href = "http://localhost:3000/api/auth/google";
              }}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 py-3 font-medium text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              <FcGoogle size={22} />
              Sign up with Google
            </button> */}

          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?
            <Link
              to={"/login"}
              className="ml-1 font-semibold text-blue-500 hover:text-blue-400"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
export default Register;

























// import { useState } from "react";
// import { registerApi } from "../../api/authApi";
// import toast from "react-hot-toast";
// import { Link, useNavigate } from "react-router-dom";

// import { FcGoogle } from "react-icons/fc";
// import PasswordInput from "../../components/common/PasswordInput";

// function Register() {
//   const navigate = useNavigate();
    
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     password: "",
//     role: "restaurant_admin",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const data = await registerApi(formData);

//       if (data.success) {
//         toast.success(data.message);

//         // localStorage.setItem("token", data.user.token);

//         navigate("/register-verification");
//         // navigate(`/verify-email/${formData.email}`);
//       } else {
//         toast.error(data.message || "Registration failed");
//       }

//     } catch (error) {
//         // alert(error.response?.data?.message || "Something went wrong");
//         toast.error(error.response?.data?.message || "Something went wrong");
//         console.log(error.response?.data);
//         console.error(error);
//     }
//   };

// return (
//   <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-6">
//     <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

//       {/* Left Side */}
//       <div className="hidden lg:flex flex-col justify-center bg-linear-to-br from-blue-600 to-blue-800 p-12 text-white">
//         <h1 className="text-5xl font-bold tracking-tight">
//           Dinora
//         </h1>

//         <p className="mt-5 text-lg text-blue-100 leading-relaxed">
//           Modern restaurant management made simple.
//         </p>

//         <div className="mt-12 space-y-6">

//           <div className="flex items-start gap-3">
//             <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
//             <p className="text-blue-100">
//               QR based ordering system
//             </p>
//           </div>

//           <div className="flex items-start gap-3">
//             <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
//             <p className="text-blue-100">
//               Live kitchen & order tracking
//             </p>
//           </div>

//           <div className="flex items-start gap-3">
//             <div className="h-3 w-3 rounded-full bg-white mt-2"></div>
//             <p className="text-blue-100">
//               Built for restaurants & customers
//             </p>
//           </div>

//         </div>
//       </div>

//       {/* Right Side */}
//       <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">

//         <div className="w-full max-w-md">

//           <div className="mb-8 text-center lg:text-left">

//             <h2 className="text-3xl font-bold text-white">
//               Create account
//             </h2>

//             <p className="mt-2 text-slate-400">
//               Join Dinora and start managing smarter.
//             </p>

//           </div>

//           <form onSubmit={handleSubmit} className="space-y-5">

//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Name
//               </label>

//               <input
//                 type="text"
//                 name="username"
//                 placeholder="Ankit"
//                 value={formData.username}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Email
//               </label>

//               <input
//                 type="email"
//                 name="email"
//                 placeholder="you@example.com"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Password
//               </label>

//               {/* <input
//                 type="password"
//                 name="password"
//                 placeholder="••••••••"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
//               /> */}
//               {/* new with icons */}
//               <PasswordInput
//                 // type="password"
//                 name="password"
//                 placeholder="••••••••"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
//               />

//             </div>

//             {/* <div>
//               <label className="block text-sm font-medium text-slate-300 mb-2">
//                 Role
//               </label>

//               <select
//                 name="role"
//                 value={formData.role}
//                 onChange={handleChange}
//                 className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
//               >
//                 <option value="customer" className="text-black">
//                   Customer
//                 </option>

//                 <option value="restaurant_admin" className="text-black">
//                   Restaurant Admin
//                 </option>
//               </select>
//             </div> */}

//             <button
//               type="submit"
//               className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
//             >
//               Create Account
//             </button>


//               {/* google authentication */}
//             {/* <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-slate-700"></div>
//               </div>

//               <div className="relative flex justify-center">
//                 <span className="bg-slate-900 px-4 text-sm text-slate-500">
//                   Continue with
//                 </span>
//               </div>
//             </div>

//             <button
//               onClick={() => {
//                 // window.open("http://localhost:3000/api/auth/google", "_self");
//                 window.location.href = "http://localhost:3000/api/auth/google";
//               }}
//               className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 py-3 font-medium text-white transition hover:border-slate-500 hover:bg-slate-800"
//             >
//               <FcGoogle size={22} />
//               Sign up with Google
//             </button> */}



//           </form>

//           <div className="mt-6 text-center text-sm text-slate-400">
//             Already have an account?

//             <Link
//               to={"/login"}
//               className="ml-1 font-semibold text-blue-500 hover:text-blue-400"
//             >
//               Login
//             </Link>
//           </div>

//         </div>

//       </div>

//     </div>
//   </div>
// );
// }

// export default Register;