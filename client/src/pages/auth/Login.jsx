import { useState } from "react";
import { loginApi } from "../../api/authApi";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { getMyRestaurantApi } from "../../api/restaurantApi";

import { FcGoogle } from "react-icons/fc";

import PasswordInput from "../../components/common/PasswordInput";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // username: "",
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false); // add this state

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // handlesubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  if (submitting) return; // ← hard guard: a click while already in-flight does nothing
  setSubmitting(true);

  try {
    const data = await loginApi(formData);
    if (data.success) {
      // if(!getMyRestaurantApi()){
      //   toast.success("Setup your restaurant to proceed");
      // } else{
      //   toast.success(data.message);
      // }
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "customer") {
        navigate("/customer");
      } else if (data.user.role === "restaurant_admin") {
        try {
          const res = await getMyRestaurantApi();
          if (res.restaurant) {
            toast.success(data.message);
            navigate("/restaurant/dashboard");
          }
          else navigate("/restaurant/setup");
          
        } catch {
          navigate("/restaurant/setup");
        }
      }
    } else {
      toast.error(data.message || "Login failed");
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Something went wrong");
    console.error(error);
  } finally {
    setSubmitting(false); // ← always reset, success or failure
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dinora</h1>

          <p className="text-slate-300 mt-2">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* <div>
            <label className="block text-white mb-2 font-medium">
              Name
            </label>

            <input
              type="text"
              name="username"
              placeholder="Enter name"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          <div>
            <label className="block text-white mb-2 font-medium">Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-white">Password</label>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            /> */}
            <PasswordInput
              name="password"
              value={formData.password}
              // onChange={(e) => set("password", e.target.value)}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />

          </div>

          {/* <div>
            <label className="block text-white mb-2 font-medium">Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
            disabled={submitting} //new to fix logout
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Login */}
            {submitting ? "Logging in..." : "Login"}
          </button>

            {/* google login authentication */}
          {/* <button>Login with Google</button> */}
          {/* <button
            onClick={() => {
              (window.open("http://localhost:3000/api/auth/google"), "_self");
            }}
            className="w-full flex items-center justify-center gap-3          rounded-xl border border-white/20 bg-white/10 py-3 font-semibold          text-white backdrop-blur-md transition-all duration-300         hover:bg-white/20 hover:-translate-y-0.5"
          >
            <FcGoogle size={22} />
            Login with Google
          </button> */}


        </form>

            <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?

            <Link
              to={"/register"}
              className="ml-1 font-semibold text-blue-500 hover:text-blue-400"
            >
              Register
            </Link>
          </div>

      </div>
    </div>
  );
}

export default Login;
