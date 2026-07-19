import { useState } from "react";
import { useParams } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../api/authApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function VerifyEmail() {
  const navigate = useNavigate();

  const { email } = useParams();

  const [otp, setOtp] = useState("");

  const handleSendOtp = async () => {
    try {
        const data = await sendOtp(email);
      // Call send OTP API here
      console.log("Sending OTP to:", email);

      if (data.success) {
  toast.success(data.message);
}
    } catch (error) {
      toast.error(
    error.response?.data?.message ||
    "Failed to send OTP"
  );
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

     try {
    const data = await verifyOtp(email, otp);

    if (data.success) {
      toast.success(data.message);
      navigate("/login");
    }

  } catch (error) {
    toast.error(
      error.response?.data?.message ||
      "Invalid OTP"
    );
  }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Verify Email
          </h1>

          <p className="text-slate-300 mt-2">
            Enter the OTP sent to your email
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-white mb-2 font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-slate-300"
          />
        </div>

        <button
          onClick={handleSendOtp}
          className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-green-700 mb-5"
        >
          Send OTP
        </button>

        <form onSubmit={handleVerifyOtp} className="space-y-5">

          <div>
            <label className="block text-white mb-2 font-medium">
              OTP
            </label>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-700"
          >
            Verify OTP
          </button>

        </form>

      </div>
    </div>
  );
}

export default VerifyEmail;