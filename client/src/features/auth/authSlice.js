import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, getMeApi } from "../../api/authApi";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const data = await loginApi(credentials);
      console.log("Full API response:", data);
      console.log("accessToken:", data.accessToken);
      console.log("user:", data.user);
      console.log("user.role:", data.user?.role);
      localStorage.setItem("token", data.accessToken);
      return data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return thunkAPI.rejectWithValue("No token");
      const data = await getMeApi();
      return data.user;
    } catch (error) {
      localStorage.removeItem("token");
      return thunkAPI.rejectWithValue("Session expired");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    initializing: true,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(loadUser.pending, (state) => {
        state.initializing = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadUser.rejected, (state) => {
        state.initializing = false;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;