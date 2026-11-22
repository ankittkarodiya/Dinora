// new
import { useQuery } from "@tanstack/react-query";
import { getSubscriptionStatusApi } from "../api/subscriptionApi";
import { fetchWithRetry } from "../utils/fetchWithRetry";

// Single source of truth for "what plan am I on" across the admin panel.
// Uses the SAME React Query key as Settings.jsx, so every page shares one
// cached request instead of each page fetching on its own.
export function useSubscription() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetchWithRetry(() => getSubscriptionStatusApi());
      return res.subscription ?? null;
    },
  });

  const subscription = data ?? null;
  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

  // error = "couldn't verify", NOT "expired"
  return { subscription, isPro, loading: isLoading, error: isError };
}






































// old
// import { useState, useEffect } from "react";
// import { getSubscriptionStatusApi } from "../api/subscriptionApi";
// import { fetchWithRetry } from "../utils/fetchWithRetry";

// export function useSubscription() {
//   const [subscription, setSubscription] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false); // ← "couldn't verify", NOT "expired"

//   useEffect(() => {
//     let cancelled = false;

//     fetchWithRetry(() => getSubscriptionStatusApi())
//       .then((data) => {
//         if (cancelled) return;
//         setSubscription(data.subscription);
//         setError(false);
//       })
//       .catch(() => {
//         if (cancelled) return;
//         setError(true);
//         setSubscription(null);
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => { cancelled = true; };
//   }, []);

//   const isPro = subscription?.plan === "pro" && subscription?.status === "active";
//   return { subscription, isPro, loading, error };
// }

























// import { useState, useEffect } from "react";
// import { getSubscriptionStatusApi } from "../api/subscriptionApi";

// // single source of truth for "what plan am I on" across the whole admin panel
// export function useSubscription() {
//   const [subscription, setSubscription] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const data = await getSubscriptionStatusApi();
//         setSubscription(data.subscription);
//       } catch {
//         setSubscription(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetch();
//   }, []);

//   const isPro = subscription?.plan === "pro" && subscription?.status === "active";

//   return { subscription, isPro, loading };
// }