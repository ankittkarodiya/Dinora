import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import PasswordInput from "../../components/common/PasswordInput";

function ChangePassword() {
  const navigate = useNavigate();

  const { email } = useParams();
  const decodedEmail = decodeURIComponent(email);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const res = await axiosInstance.post(`/auth/change-password/${email}`, {
        // currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Change Password
          </h1>

          <p className="text-slate-300 mt-2">
            Update your account password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Current Password */}
          {/* <div>
            <label className="block text-white mb-2 font-medium">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div> */}

          {/* New Password */}
          <div>
            <label className="block text-white mb-2 font-medium">
              New Password
            </label>
            {/* <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            /> */}
            {/* new with icons */}
            <PasswordInput
              // type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white mb-2 font-medium">
              Confirm Password
            </label>
            {/* <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            /> */}
            {/* new with icons */}
            <PasswordInput
              // type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
          >
            Update Password
          </button>

        </form>

        {/* Back */}
        {/* <div className="mt-6 text-center text-slate-300">
          Back to{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-semibold text-blue-400 hover:text-blue-300"
          >
            Login
          </span>
        </div> */}

      </div>
    </div>
  );
}

export default ChangePassword;