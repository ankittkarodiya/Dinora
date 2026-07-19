import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  customerRegisterApi, customerLoginApi,
  customerLogoutApi, getCustomerMeApi,
} from "../../api/customerAuthApi";

// import {
//   sendOtpApi, customerRegisterApi, customerLoginApi,
//   customerLogoutApi, getCustomerMeApi,
// } from "../../api/customerAuthApi";

// sessionStorage clears when tab closes — perfect for QR scan fresh start
// localStorage would persist across tabs — that's the bug
const TOKEN_KEY = "customerToken";
const getToken = () => sessionStorage.getItem(TOKEN_KEY);
const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const sendCustomerOtp = createAsyncThunk(
  "customerAuth/sendOtp",
  async (phone, thunkAPI) => {
    try { return await sendOtpApi(phone); }
    catch (error) { return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to send OTP"); }
  }
);

export const registerCustomer = createAsyncThunk(
  "customerAuth/register",
  async (payload, thunkAPI) => {
    try {
      const data = await customerRegisterApi(payload);
      setToken(data.token);
      return data.customer;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

export const loginCustomer = createAsyncThunk(
  "customerAuth/login",
  async (payload, thunkAPI) => {
    try {
      const data = await customerLoginApi(payload);
      setToken(data.token);
      return data.customer;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const logoutCustomer = createAsyncThunk(
  "customerAuth/logout",
  async () => {
    try { await customerLogoutApi(); } catch {}
    clearToken();
  }
);

export const loadCustomer = createAsyncThunk(
  "customerAuth/loadCustomer",
  async (_, thunkAPI) => {
    try {
      const token = getToken();
      if (!token) return thunkAPI.rejectWithValue("No token");
      const data = await getCustomerMeApi();
      return data.customer;
    } catch {
      clearToken();
      return thunkAPI.rejectWithValue("Session expired");
    }
  }
);

const customerAuthSlice = createSlice({
  name: "customerAuth",
  initialState: {
    currentCustomer: null,
    otpSent: false,
    loading: false,
    error: null,
    initializing: true,
  },
  reducers: {
    clearCustomerError: (state) => { state.error = null; },
    resetOtpState: (state) => { state.otpSent = false; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendCustomerOtp.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendCustomerOtp.fulfilled, (state) => { state.loading = false; state.otpSent = true; })
      .addCase(sendCustomerOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(registerCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; state.otpSent = false; })
      .addCase(registerCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(loginCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; state.otpSent = false; })
      .addCase(loginCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(logoutCustomer.fulfilled, (state) => { state.currentCustomer = null; state.otpSent = false; state.error = null; });

    builder
      .addCase(loadCustomer.pending, (state) => { state.initializing = true; })
      .addCase(loadCustomer.fulfilled, (state, action) => { state.initializing = false; state.currentCustomer = action.payload; })
      .addCase(loadCustomer.rejected, (state) => { state.initializing = false; state.currentCustomer = null; });
  },
});

export const { clearCustomerError, resetOtpState } = customerAuthSlice.actions;

export const selectCurrentCustomer = (state) => state.customerAuth.currentCustomer;
export const selectCustomerLoading = (state) => state.customerAuth.loading;
export const selectCustomerError = (state) => state.customerAuth.error;
export const selectOtpSent = (state) => state.customerAuth.otpSent;

export default customerAuthSlice.reducer;

























// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import {
//   sendOtpApi,
//   customerRegisterApi,
//   customerLoginApi,
//   customerLogoutApi,
//   getCustomerMeApi,
// } from "../../api/customerAuthApi";

// const CUSTOMER_TOKEN_KEY = "customerToken";

// export const sendCustomerOtp = createAsyncThunk(
//   "customerAuth/sendOtp",
//   async (phone, thunkAPI) => {
//     try {
//       return await sendOtpApi(phone);
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || "Failed to send OTP"
//       );
//     }
//   }
// );

// export const registerCustomer = createAsyncThunk(
//   "customerAuth/register",
//   async (payload, thunkAPI) => {
//     try {
//       const data = await customerRegisterApi(payload);
//       localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
//       return data.customer;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || "Registration failed"
//       );
//     }
//   }
// );

// export const loginCustomer = createAsyncThunk(
//   "customerAuth/login",
//   async (payload, thunkAPI) => {
//     try {
//       const data = await customerLoginApi(payload);
//       localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
//       return data.customer;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || "Login failed"
//       );
//     }
//   }
// );

// export const logoutCustomer = createAsyncThunk(
//   "customerAuth/logout",
//   async (_, thunkAPI) => {
//     try {
//       await customerLogoutApi();
//     } catch {
//       // even if API fails, clear locally
//     } finally {
//       localStorage.removeItem(CUSTOMER_TOKEN_KEY);
//     }
//   }
// );

// export const loadCustomer = createAsyncThunk(
//   "customerAuth/loadCustomer",
//   async (_, thunkAPI) => {
//     try {
//       const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
//       if (!token) return thunkAPI.rejectWithValue("No token");
//       const data = await getCustomerMeApi();
//       return data.customer;
//     } catch {
//       localStorage.removeItem(CUSTOMER_TOKEN_KEY);
//       return thunkAPI.rejectWithValue("Session expired");
//     }
//   }
// );

// const customerAuthSlice = createSlice({
//   name: "customerAuth",
//   initialState: {
//     currentCustomer: null,
//     otpSent: false,
//     loading: false,
//     error: null,
//     initializing: true,
//   },
//   reducers: {
//     clearCustomerError: (state) => { state.error = null; },
//     resetOtpState: (state) => { state.otpSent = false; state.error = null; },
//   },
//   extraReducers: (builder) => {
//     // send otp
//     builder
//       .addCase(sendCustomerOtp.pending, (state) => { state.loading = true; state.error = null; })
//       .addCase(sendCustomerOtp.fulfilled, (state) => { state.loading = false; state.otpSent = true; })
//       .addCase(sendCustomerOtp.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

//     // register
//     builder
//       .addCase(registerCustomer.pending, (state) => { state.loading = true; state.error = null; })
//       .addCase(registerCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; state.otpSent = false; })
//       .addCase(registerCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

//     // login
//     builder
//       .addCase(loginCustomer.pending, (state) => { state.loading = true; state.error = null; })
//       .addCase(loginCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; state.otpSent = false; })
//       .addCase(loginCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

//     // logout
//     builder
//       .addCase(logoutCustomer.fulfilled, (state) => {
//         state.currentCustomer = null;
//         state.otpSent = false;
//         state.error = null;
//       });

//     // load customer
//     builder
//       .addCase(loadCustomer.pending, (state) => { state.initializing = true; })
//       .addCase(loadCustomer.fulfilled, (state, action) => { state.initializing = false; state.currentCustomer = action.payload; })
//       .addCase(loadCustomer.rejected, (state) => { state.initializing = false; state.currentCustomer = null; });
//   },
// });

// export const { clearCustomerError, resetOtpState } = customerAuthSlice.actions;

// export const selectCurrentCustomer = (state) => state.customerAuth.currentCustomer;
// export const selectCustomerLoading = (state) => state.customerAuth.loading;
// export const selectCustomerError = (state) => state.customerAuth.error;
// export const selectOtpSent = (state) => state.customerAuth.otpSent;

// export default customerAuthSlice.reducer;