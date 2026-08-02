import axios from "axios";
import axiosInstance from "../../api/axiosInstance";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Verification = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axiosInstance.post(
          "auth/verify",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.success) {
          setStatus("Email verified successfully");

          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setStatus("Invalid or expired token");
        }
      } catch (error) {
        console.log(error);
        // setStatus("Verification failed, please try again");
        setStatus(error.response?.data?.message || "Verification failed, please try again");

      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <button
        className="w-3/5 max-w-md px-6 py-4 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-300 bg-linear-to-r from-indigo-500 to-indigo-600 hover:scale-105 hover:shadow-2xl"
      >
        {status}
      </button>
    </div>
  );
};

export default Verification;