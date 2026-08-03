import axios from "axios";
import toast from "react-hot-toast";




const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});




let sessionInvalidatedHandled = false; // ← add this near the top of the file, outside any function



// Routes that belong to the customer flow — must ONLY ever get the customer token
// const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/reviews", "/public/orders", "/public/payment"];
const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/"];
const isCustomerRoute = (url) => CUSTOMER_ROUTE_PATTERNS.some((pattern) => url.includes(pattern));



// ── Request interceptor — attaches the correct token per route type ──
// axiosInstance.interceptors.request.use(
//   (config) => {
//     if (isCustomerRoute(config.url)) {
//       const customerToken = sessionStorage.getItem("customerToken");
//       if (customerToken) {
//         config.headers.Authorization = `Bearer ${customerToken}`;
//       }
//     } else {
//       const adminToken = localStorage.getItem("token");
//       if (adminToken) {
//         config.headers.Authorization = `Bearer ${adminToken}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
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
        window.location.href = "/restaurant/setup?renew=true";
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
      toast.error("You were logged out because your account was signed in on another device.", {
        duration: 4000,
      });

      // silence every other toast anywhere in the app until the redirect
      // completes — other components' own catch blocks are just downstream
      // side effects of this same invalidated session and would otherwise
      // stack on top of the real message, making it unreadable
      toast.error = () => {};
      toast.success = () => {};
      toast.dismiss = () => {};

      // small delay so the toast actually has time to render and be seen
      // before the page navigates away
      setTimeout(() => {
        window.location.href = "/login";
      }, 600);

      return Promise.reject(error);
    }



    // new for account deactivation
    // SESSION_INVALIDATED where its condition could never be true
    if (error.response?.data?.code === "ACCOUNT_DEACTIVATED") {
      if (sessionInvalidatedHandled) {
        return Promise.reject(error);
      }
      sessionInvalidatedHandled = true;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.dismiss();
      toast.error("Your account has been deactivated. Contact support if you believe this is a mistake.", {
        duration: 4000,
      });

      toast.error = () => {};
      toast.success = () => {};
      toast.dismiss = () => {};

      setTimeout(() => {
        window.location.href = "/login";
      }, 600);

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
            window.location.href = "/login";
          }
          return Promise.reject(retryError);
        }
      }
      // safety net — should rarely be reached given the retry above
      // already handles both outcomes, but kept as a fallback
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


export default axiosInstance;


























// import axios from "axios";
// import toast from "react-hot-toast";

// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: { "Content-Type": "application/json" },
// });

// let sessionInvalidatedHandled = false; // ← add this near the top of the file, outside any function

// // Routes that belong to the customer flow — must ONLY ever get the customer token
// // const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/reviews", "/public/orders", "/public/payment"];
// const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/"];
// const isCustomerRoute = (url) =>
//   CUSTOMER_ROUTE_PATTERNS.some((pattern) => url.includes(pattern));
// // ── Request interceptor — attaches the correct token per route type ──
// axiosInstance.interceptors.request.use(
//   (config) => {
//     if (isCustomerRoute(config.url)) {
//       const customerToken = sessionStorage.getItem("customerToken");
//       if (customerToken) {
//         config.headers.Authorization = `Bearer ${customerToken}`;
//       }
//     } else {
//       const adminToken = localStorage.getItem("token");
//       if (adminToken) {
//         config.headers.Authorization = `Bearer ${adminToken}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );
// // ── Response interceptor — ONE consolidated handler, no leftover duplicates ──
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // subscription expiry — redirect to renew, unrelated to session/token logic
//     if (error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
//       if (window.location.pathname !== "/restaurant/setup") {
//         window.location.href = "/restaurant/setup?renew=true";
//       }
//       return Promise.reject(error);
//     }
//     // a genuine, confirmed second-device login — always a real logout,
//     // never subject to retry, since this means another session took over
//     if (error.response?.data?.code === "SESSION_INVALIDATED") {
//       // ← THE FIX: several requests can fail with this same code within
//       // milliseconds of each other (RestaurantLayout + the page's own
//       // fetch, all firing in parallel with the same invalidated token).
//       // Without this guard, each one independently shows its own toast
//       // and redirect before the page actually navigates away — this
//       // ensures only the FIRST one to arrive actually does anything.
//       if (sessionInvalidatedHandled) {
//         return Promise.reject(error);
//       }
//       sessionInvalidatedHandled = true;

//       localStorage.removeItem("token");
//       localStorage.removeItem("user");

//       // clear anything already showing, then show ONLY this one message
//       toast.dismiss();

//       toast.error(
//         "You were logged out because your account was signed in on another device.",
//         {
//           duration: 2000,
//         },
//       );

//       // ← THE FIX: once this specific toast has fired, silence every other
//       // toast call anywhere in the app until the redirect completes — other
//       // components' own catch blocks (e.g. "Failed to load menu") are just
//       // downstream side effects of this same invalidated session and would
//       // otherwise stack on top of the real message, making it unreadable
//       toast.error = () => {};
//       toast.success = () => {};
//       toast.dismiss = () => {};

//       // small delay so the toast actually has time to render and be seen
//       // before the page navigates away — without this, redirect can outrace
//       // the toast's own render, so it barely flashes before vanishing
//       // window.location.href = "/login";
//       setTimeout(() => {
//         window.location.href = "/login";
//       }, 600);
//       return Promise.reject(error);
//     }
//     if (error.response?.status === 401) {
//       const originalRequest = error.config;
//       // Customer routes: no retry, no redirect. A customer's session
//       // expiring quietly is low-stakes — they can just log in again
//       // if they want to leave a review.
//       if (isCustomerRoute(originalRequest.url)) {
//         sessionStorage.removeItem("customerToken");
//         return Promise.reject(error);
//       }
//       // ── THE ACTUAL FIX for the sleep/wake false-logout problem ──
//       // On the FIRST 401 for a given admin request, don't assume the
//       // session is really dead. Wait briefly for the network to settle
//       // after a laptop wake event, then retry this exact request once.
//       if (!originalRequest._retriedAfter401) {
//         originalRequest._retriedAfter401 = true;
//         await new Promise((resolve) => setTimeout(resolve, 1200));
//         try {
//           return await axiosInstance(originalRequest);
//         } catch (retryError) {
//           // retry failed too — this is very likely a genuine expired/invalid
//           // token, fall through to the real logout below
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//           if (!window.location.pathname.includes("/login")) {
//             window.location.href = "/login";
//           }
//           return Promise.reject(retryError);
//         }
//       }
//       // safety net — should rarely be reached given the retry above
//       // already handles both outcomes, but kept as a fallback
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       if (!window.location.pathname.includes("/login")) {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   },
// );
// export default axiosInstance;














// import axios from "axios";
// import toast from "react-hot-toast";

// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: { "Content-Type": "application/json" },
// });

// let sessionInvalidatedHandled = false; // ← add this near the top of the file, outside any function

// // Routes that belong to the customer flow — must ONLY ever get the customer token
// // const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/reviews", "/public/orders", "/public/payment"];
// const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/"];
// const isCustomerRoute = (url) => CUSTOMER_ROUTE_PATTERNS.some((pattern) => url.includes(pattern));

// // ── Request interceptor — attaches the correct token per route type ──
// axiosInstance.interceptors.request.use(
//   (config) => {
//     if (isCustomerRoute(config.url)) {
//       const customerToken = sessionStorage.getItem("customerToken");
//       if (customerToken) {
//         config.headers.Authorization = `Bearer ${customerToken}`;
//       }
//     } else {
//       const adminToken = localStorage.getItem("token");
//       if (adminToken) {
//         config.headers.Authorization = `Bearer ${adminToken}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ── Response interceptor — ONE consolidated handler, no leftover duplicates ──
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // subscription expiry — redirect to renew, unrelated to session/token logic
//     if (error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
//       if (window.location.pathname !== "/restaurant/setup") {
//         window.location.href = "/restaurant/setup?renew=true";
//       }
//       return Promise.reject(error);
//     }

//     // a genuine, confirmed second-device login — always a real logout,
//     // never subject to retry, since this means another session took over
//     if (error.response?.data?.code === "SESSION_INVALIDATED") {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       toast.error("You were logged out because your account was signed in on another device.");
//       window.location.href = "/login";
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401) {
//       const originalRequest = error.config;

//       // Customer routes: no retry, no redirect. A customer's session
//       // expiring quietly is low-stakes — they can just log in again
//       // if they want to leave a review.
//       if (isCustomerRoute(originalRequest.url)) {
//         sessionStorage.removeItem("customerToken");
//         return Promise.reject(error);
//       }

//       // ── THE ACTUAL FIX for the sleep/wake false-logout problem ──
//       // On the FIRST 401 for a given admin request, don't assume the
//       // session is really dead. Wait briefly for the network to settle
//       // after a laptop wake event, then retry this exact request once.
//       if (!originalRequest._retriedAfter401) {
//         originalRequest._retriedAfter401 = true;
//         await new Promise((resolve) => setTimeout(resolve, 1200));
//         try {
//           return await axiosInstance(originalRequest);
//         } catch (retryError) {
//           // retry failed too — this is very likely a genuine expired/invalid
//           // token, fall through to the real logout below
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//           if (!window.location.pathname.includes("/login")) {
//             window.location.href = "/login";
//           }
//           return Promise.reject(retryError);
//         }
//       }

//       // safety net — should rarely be reached given the retry above
//       // already handles both outcomes, but kept as a fallback
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       if (!window.location.pathname.includes("/login")) {
//         window.location.href = "/login";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

// // import axios from "axios";
// // import toast from "react-hot-toast";

// // const axiosInstance = axios.create({
// //   baseURL: import.meta.env.VITE_API_URL,
// //   headers: { "Content-Type": "application/json" },
// //   // withCredentials: true, // ← add this
// // });

// // // Routes that belong to the customer flow — must ONLY ever get the customer token
// // // const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/reviews", "/public/orders"];
// // const CUSTOMER_ROUTE_PATTERNS = ["/customer/", "/public/reviews", "/public/orders", "/public/payment"];

// // const isCustomerRoute = (url) =>
// //   CUSTOMER_ROUTE_PATTERNS.some((pattern) => url.includes(pattern));

// // axiosInstance.interceptors.request.use(
// //   (config) => {
// //     if (isCustomerRoute(config.url)) {
// //       // customer token lives in sessionStorage — clears on new tab/QR scan
// //       const customerToken = sessionStorage.getItem("customerToken");
// //       if (customerToken) {
// //         config.headers.Authorization = `Bearer ${customerToken}`;
// //       }
// //       // if no customer token, send with NO auth header — do not fall back to admin token
// //     } else {
// //       const adminToken = localStorage.getItem("token");
// //       if (adminToken) {
// //         config.headers.Authorization = `Bearer ${adminToken}`;
// //       }
// //     }
// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // // axiosInstance.interceptors.response.use(
// // //   (response) => response,
// // //   (error) => {
// // //     if (error.response?.status === 401) {
// // //       if (isCustomerRoute(error.config.url)) {
// // //         sessionStorage.removeItem("customerToken");
// // //         // no redirect — Redux state naturally reflects logged-out customer
// // //       } else {
// // //         localStorage.removeItem("token");
// // //         localStorage.removeItem("user");
// // //         // NO window.location.href — never hard-reload the page
// // //         // ProtectedRoute will correctly show login on the next navigation
// // //       }
// // //     }
// // //     return Promise.reject(error);
// // //   }
// // // );

// // axiosInstance.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
// //       if (window.location.pathname !== "/restaurant/setup") {
// //         window.location.href = "/restaurant/setup?renew=true";
// //       }
// //     }

// //     // new for session
// //     if (error.response?.data?.code === "SESSION_INVALIDATED") {
// //       localStorage.removeItem("token");
// //       localStorage.removeItem("user");
// //       toast.error("You were logged out because your account was signed in on another device.");
// //       window.location.href = "/login"; // ← this ONE specific case is fine to hard-redirect,
// //                                         //   since the session is genuinely dead everywhere
// //     }

// //     // if (error.response?.status === 401) {
// //     //   if (isCustomerRoute(error.config.url)) {
// //     //     sessionStorage.removeItem("customerToken");
// //     //   } else {
// //     //     localStorage.removeItem("token");
// //     //     localStorage.removeItem("user");
// //     //   }
// //     // }

// //     if (error.response?.status === 401) {
// //   if (isCustomerRoute(error.config.url)) {
// //     sessionStorage.removeItem("customerToken");
// //     // customer session expiring quietly is fine — they can browse the menu
// //     // without being logged in, no redirect needed here
// //   } else {
// //     localStorage.removeItem("token");
// //     localStorage.removeItem("user");
// //     // ← THE FIX: an expired/invalid admin token means every subsequent
// //     // request will keep failing. Redirect immediately instead of letting
// //     // each page show its own confusing "failed to load" error independently.
// //     if (!window.location.pathname.includes("/login")) {
// //       window.location.href = "/login";
// //     }
// //   }
// // }

// //     return Promise.reject(error);
// //   }
// // );

// // export default axiosInstance;

// // import axios from "axios";

// // const axiosInstance = axios.create({
// //   baseURL: import.meta.env.VITE_API_URL,
// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });

// // axiosInstance.interceptors.request.use(
// //   (config) => {
// //     // old
// //     // const token = localStorage.getItem("token");
// //     // if (token) {
// //     //   config.headers.Authorization = `Bearer ${token}`;
// //     // }
// //     // return config;

// //     // new
// //     // customer routes use customerToken
// //     // admin routes use token
// //     const isCustomerRoute =
// //       config.url.includes("/customer/") ||
// //       config.url.includes("/public/reviews") ||
// //       config.url.includes("/public/orders");

// //     const customerToken = localStorage.getItem("customerToken");
// //     const adminToken = localStorage.getItem("token");

// //     if (isCustomerRoute && customerToken) {
// //       config.headers.Authorization = `Bearer ${customerToken}`;
// //     } else if (adminToken) {
// //       config.headers.Authorization = `Bearer ${adminToken}`;
// //     } else if (customerToken) {
// //       config.headers.Authorization = `Bearer ${customerToken}`;
// //     }

// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // axiosInstance.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     if (error.response?.status === 401) {
// //       localStorage.removeItem("token");
// //       window.location.href = "/login";

// //       const isCustomerRoute =
// //         error.config.url.includes("/customer/") ||
// //         error.config.url.includes("/public/reviews");

// //       if (isCustomerRoute) {
// //         localStorage.removeItem("customerToken");
// //       }
// //     }
// //     return Promise.reject(error);
// //   }
// // );

// // export default axiosInstance;
