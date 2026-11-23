// light theme
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
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <span className="text-[#171717]">Din</span>
            <span className="text-[#E34F36]">ora</span>
          </h1>

          <p className="text-gray-600 mt-2">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-gray-900 mb-2 font-medium">Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 focus:ring-0 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-900">Password</label>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 transition"
              >
                Forgot Password?
              </button>
            </div>

            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600"
            />

          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

        </form>

            <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?

            <Link
              to={"/register"}
              className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
            >
              Register
            </Link>
          </div>

      </div>
    </div>
  );
}

export default Login;
