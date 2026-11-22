import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  customerRegisterApi, customerLoginApi,
  customerLogoutApi, getCustomerMeApi, identifyCustomerApi
} from "../../api/customerAuthApi";

const TOKEN_KEY = "customerToken";
const getToken = () => sessionStorage.getItem(TOKEN_KEY);
const setToken = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

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

export const identifyCustomer = createAsyncThunk(
  "customerAuth/identify",
  async (payload, thunkAPI) => {
    try {
      const data = await identifyCustomerApi(payload);
      setToken(data.token);
      return data.customer;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Could not continue");
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
    loading: false,
    error: null,
    initializing: true,
  },
  reducers: {
    clearCustomerError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(identifyCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(identifyCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; })
      .addCase(identifyCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(registerCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; })
      .addCase(registerCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(loginCustomer.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginCustomer.fulfilled, (state, action) => { state.loading = false; state.currentCustomer = action.payload; })
      .addCase(loginCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; });

    builder
      .addCase(logoutCustomer.fulfilled, (state) => { state.currentCustomer = null; state.error = null; });

    builder
      .addCase(loadCustomer.pending, (state) => { state.initializing = true; })
      .addCase(loadCustomer.fulfilled, (state, action) => { state.initializing = false; state.currentCustomer = action.payload; })
      .addCase(loadCustomer.rejected, (state) => { state.initializing = false; state.currentCustomer = null; });
  },
});

export const { clearCustomerError } = customerAuthSlice.actions;

export const selectCurrentCustomer = (state) => state.customerAuth.currentCustomer;
export const selectCustomerLoading = (state) => state.customerAuth.loading;
export const selectCustomerError = (state) => state.customerAuth.error;

export default customerAuthSlice.reducer;
