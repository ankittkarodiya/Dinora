import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getOrdersApi } from "../api/orderApi";
import { getMyRestaurantApi } from "../api/restaurantApi";
import { getSocket } from "../utils/socket";
import { isNotificationSoundEnabled, getSelectedSound, canUseNotificationSound  } from "../utils/notificationPrefs";
import { playSound, unlockAudio } from "../utils/notificationSounds";
import toast from "react-hot-toast";

const OrdersContext = createContext(null);

// ── Lives at the layout level, not inside any single page ───────────
// This means it mounts once when the admin logs in and stays alive for
// as long as they're anywhere in the admin panel — Dashboard, Menu Items,
// Settings, Orders, all of it. New-order detection, the notification
// sound, and the Socket.io connection itself are no longer tied to
// whether the Orders page specifically happens to be open.
export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const restaurantIsPro = restaurant?.subscriptionPlan === "pro";

  // Same ref-based fix as before — needed here too, since the socket
  // event handler below is set up once and would otherwise capture a
  // permanently stale value of restaurantIsPro from before the real
  // restaurant data finished loading.
  const restaurantIsProRef = useRef(false);
  useEffect(() => {
    restaurantIsProRef.current = restaurantIsPro;
  }, [restaurantIsPro]);

  const hasFetchedRef = useRef(false);

  // ── Initial load — existing orders + restaurant info, once ────────
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    (async () => {
      try {
        const [ordersData, restaurantData] = await Promise.all([
          getOrdersApi(),
          getMyRestaurantApi(),
        ]);
        setOrders(ordersData.orders || []);
        setRestaurant(restaurantData.restaurant);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Unlock audio on the admin's very first click, anywhere ─────────
  // Browsers only let an AudioContext produce sound if it was resumed
  // during a genuine user gesture — this listens for that gesture ONCE,
  // no matter which admin page it happens on.
  useEffect(() => {
    const handleFirstClick = () => {
      unlockAudio();
      document.removeEventListener("click", handleFirstClick);
    };
    document.addEventListener("click", handleFirstClick);
    return () => document.removeEventListener("click", handleFirstClick);
  }, []);

  // ── Keep the screen awake for as long as the admin is in the panel ─
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // not supported on this browser/device — fails silently
      }
    };
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  // ── The real-time connection ────────────────────────────────────────
  // Joins this restaurant's private room once we know its ID, and listens
  // for newOrder events for as long as this provider is mounted — which,
  // since it lives in the layout, means for the entire admin session.
//   useEffect(() => {
//     if (!restaurant?._id) return;

//     const socket = getSocket();
//     socket.emit("join-restaurant", restaurant._id);

//     const handleNewOrder = (order) => {
//       setOrders((prev) => {
//         // safety net — never add the same order twice, in case of a
//         // reconnect or duplicate emit
//         if (prev.some((o) => o._id === order._id)) return prev;
//         return [order, ...prev];
//       });

//     //   if (restaurantIsProRef.current && isNotificationSoundEnabled()) {
//     //     playSound(getSelectedSound());
//     //   }
//     // new to replace the above
//     if (canUseNotificationSound(restaurantIsProRef.current) && isNotificationSoundEnabled()) {
//         playSound(getSelectedSound());
//     }

//       toast.custom(
//         () => (
//           <div className="bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
//             ⓘ New order!
//           </div>
//         ),
//         { duration: 2500, position: "top-center" },
//       );
//     };

//     socket.on("newOrder", handleNewOrder);

//     return () => {
//       socket.off("newOrder", handleNewOrder);
//     };
//   }, [restaurant?._id]);

// new use effect
useEffect(() => {
  if (!restaurant?._id) return;

  const socket = getSocket();

  // ← THE FIX: Socket.io does NOT automatically restore room membership
  // after a disconnect/reconnect (network switch, mobile OS backgrounding,
  // any brief connection drop). A fresh reconnection gets a brand-new,
  // empty room membership every time. Without rejoining on every single
  // "connect" event — not just the first one — the socket looks perfectly
  // connected but silently stops receiving any events after the first
  // reconnection, exactly matching "works sometimes, not every time."
  const joinRoom = () => socket.emit("join-restaurant", restaurant._id);
  joinRoom(); // join immediately if already connected right now
  socket.on("connect", joinRoom); // and rejoin every time a (re)connection happens

  const handleNewOrder = (order) => {
    setOrders((prev) => {
      if (prev.some((o) => o._id === order._id)) return prev;
      return [order, ...prev];
    });

    if (restaurantIsProRef.current && isNotificationSoundEnabled()) {
      playSound(getSelectedSound());
    }

    toast.custom(
      () => (
        <div className="bg-amber-400 text-slate-900 font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          ⓘ New order!
        </div>
      ),
      { duration: 2500, position: "top-center" },
    );
  };

  socket.on("newOrder", handleNewOrder);

  return () => {
    socket.off("connect", joinRoom);
    socket.off("newOrder", handleNewOrder);
  };
}, [restaurant?._id]);

  // ── Used by action handlers (accept/print/status/cancel/confirm) ──
  // Patches one specific order in place once the backend confirms a change.
  const updateOrderInList = (orderId, updatedOrder) => {
    setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
  };

  // ── Manual full refetch, used by the "Refresh" button ──────────────
  const refetchOrders = async () => {
    try {
      const data = await getOrdersApi();
      setOrders(data.orders || []);
    } catch {
      // keep showing whatever's already there rather than clearing it
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        restaurant,
        restaurantIsPro,
        loading,
        updateOrderInList,
        refetchOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}