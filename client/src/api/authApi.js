import axiosInstance from "./axiosInstance";

export const registerApi = async (userData) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};

export const verification = async () => {
  const token = localStorage.getItem("token");

  const response = await axiosInstance.post("/auth/verify", {}, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  }
                })
  
  return response.data;
};

export const sendOtp = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
}

export const verifyOtp = async (email, otp) => {
  const response = await axiosInstance.post(`/auth/verify-otp/${email}`, { email, otp });
  return response.data;
}

export const loginApi = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const getMeApi = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};


// new for actually making isLoggedin true and false in db
export const logoutApi = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};