import axios from "axios";
import toast from "react-hot-toast";

import { navigateTo } from "../utils/navigation"; // ← new, at the top of the file

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

let sessionInvalidatedHandled = false; // ← add this near the top of the file, outside any function

// Routes that belong to the customer flow — must ONLY ever get the customer token
const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/"];
const isCustomerRoute = (url) => CUSTOMER_ROUTE_PATTERNS.some((pattern) => url.includes(pattern));

// ── Request interceptor — attaches the correct token per route type ──
axiosInstance.interceptors.request.use(
  (config) => {
    // ← THE FIX: if the caller already explicitly set an Authorization
    // header (like Verification.jsx does, with a token from the URL),
    // never override it — only fill it in automatically when it's missing.
    if (config.headers.Authorization) {
      return config;
    }

    if (isCustomerRoute(config.url)) {
      const customerToken = sessionStorage.getItem("customerToken");
      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
      }
    } else {
      const adminToken = localStorage.getItem("token");
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — ONE consolidated handler, no leftover duplicates ──
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // subscription expiry — redirect to renew, unrelated to session/token logic
    if (error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
      if (window.location.pathname !== "/restaurant/setup") {
        navigateTo("/restaurant/setup?renew=true");
      }
      return Promise.reject(error);
    }
    // a genuine, confirmed second-device login — always a real logout,
    // never subject to retry, since this means another session took over
    if (error.response?.data?.code === "SESSION_INVALIDATED") {
      // ← THE FIX: several requests can fail with this same code within
      // milliseconds of each other (RestaurantLayout + the page's own
      // fetch, all firing in parallel with the same invalidated token).
      // This guard ensures only the FIRST one to arrive actually does
      // anything — every later one is silently ignored.
      if (sessionInvalidatedHandled) {
        return Promise.reject(error);
      }
      sessionInvalidatedHandled = true;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // clear anything currently showing, then show ONLY this one message
      toast.dismiss();
      toast.error("You were logged out because your account was signed in on another device.");

      // silence every other toast anywhere in the app until the redirect
      // completes — other components' own catch blocks are just downstream
      // side effects of this same invalidated session and would otherwise
      // stack on top of the real message, making it unreadable

      // small delay so the toast actually has time to render and be seen
      // before the page navigates away

      // ← redirect happens immediately — the toast keeps living on its own,
      // since this is a client-side navigation, not a full page reload
      navigateTo("/login");

      setTimeout(() => {
        sessionInvalidatedHandled = false;
      }, 1000);

      return Promise.reject(error);
    }

    // new for account deactivation
    if (error.response?.data?.code === "ACCOUNT_DEACTIVATED") {
      if (sessionInvalidatedHandled) {
        return Promise.reject(error);
      }
      sessionInvalidatedHandled = true;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.dismiss();
      toast.error("Your account has been deactivated. Contact support if you believe this is a mistake.");

      // ← redirect happens immediately — the toast keeps living on its own,
      // since this is a client-side navigation, not a full page reload
      navigateTo("/login");

      // ← THE FIX: since we no longer reload the page (which used to reset
      // this flag automatically), reset it manually shortly after navigating,
      // so a FUTURE session-invalidation event (after logging back in) isn't
      // silently ignored forever by a flag that's stuck true from this tab's
      // entire lifetime
      setTimeout(() => {
        sessionInvalidatedHandled = false;
      }, 1000);

      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const originalRequest = error.config;
      // Customer routes: no retry, no redirect. A customer's session
      // expiring quietly is low-stakes — they can just log in again
      // if they want to leave a review.
      if (isCustomerRoute(originalRequest.url)) {
        sessionStorage.removeItem("customerToken");
        return Promise.reject(error);
      }
      // ── THE ACTUAL FIX for the sleep/wake false-logout problem ──
      // On the FIRST 401 for a given admin request, don't assume the
      // session is really dead. Wait briefly for the network to settle
      // after a laptop wake event, then retry this exact request once.
      if (!originalRequest._retriedAfter401) {
        originalRequest._retriedAfter401 = true;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        try {
          return await axiosInstance(originalRequest);
        } catch (retryError) {
          // retry failed too — this is very likely a genuine expired/invalid
          // token, fall through to the real logout below
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (!window.location.pathname.includes("/login")) {
            navigateTo("/login");
          }
          return Promise.reject(retryError);
        }
      }
      // safety net — should rarely be reached given the retry above
      // already handles both outcomes, but kept as a fallback
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        navigateTo("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
