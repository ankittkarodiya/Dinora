// light theme
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

    // ← THE FIX: validate before ever hitting the API
  if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
    toast.error("All fields are required");
    return;
  }

    setCreatingAccount(true);
    try {
      const data = await registerApi(formData);
      if (data.success) {
        toast.success("Verify your email to register");
        navigate("/register-verification");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
        console.log(error.response?.data);
        console.error(error);
    } finally {
      setCreatingAccount(false);
    }
  };
return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
    <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center bg-linear-to-br from-blue-600 to-blue-700 p-12 text-white">

        <h1
          className="text-5xl font-extrabold tracking-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
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
            <h2 className="text-3xl font-bold text-gray-900">
              Create account
            </h2>
            <p className="mt-2 text-gray-600">
              Join Dinora and start managing smarter.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                name="username"
                placeholder="Ankit Saini"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <PasswordInput
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={creatingAccount}
               className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingAccount ? "Creating Account..." : "Create Account"}
            </button>

          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?
            <Link
              to={"/login"}
              className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
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
