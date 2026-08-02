import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./app/store.js";
import App from "./App";
import './index.css'

// ← new: one shared query client for the whole app. staleTime keeps data
// "fresh" for 30 seconds after fetching — during that window, switching
// pages and back reuses the cached data instantly with no refetch at all.
// After that, React Query still shows the cached data instantly, but
// quietly refetches in the background to catch any updates.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false, // avoid a refetch every time the tab regains focus, e.g. on mobile
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" toastOptions={{ style: { background: "#1E293B", color: "#E2E8F0" } }} />
        </BrowserRouter>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);







// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
// import { Provider } from "react-redux";
// import { Toaster } from "react-hot-toast";
// import { store } from "./app/store.js";
// import App from "./App";
// import './index.css'

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <BrowserRouter>
//         <App />
//         <Toaster position="top-right" toastOptions={{ style: { background: "#1E293B", color: "#E2E8F0" } }} />
//       </BrowserRouter>
//     </Provider>
//   </React.StrictMode>
// );
