// This runs completely separately from your React app — it's the one
// piece that keeps working even when the app itself is closed/suspended,
// since it's managed by the browser/OS, not by your page's own JavaScript.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "New Order", body: "You have a new order" };
  }

  const title = data.title || "New Order";

//   const options = {
//     body: data.body || "",
//     // icon: "/icons/icon-192 (1).png",
//     icon: "/icons/icon-192new.png",
//     badge: "/icons/icon-192new.png",
//     vibrate: [200, 100, 200],
//   };

const options = {
  body: data.body || "",
  icon: "https://www.dinora.in/icons/icon-192new.png",
  badge: "https://www.dinora.in/icons/icon-192new.png",
  // new
  image: data.image,
  
  vibrate: [200, 100, 200],
};

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // if the admin app is already open in some tab/window, just focus it
      for (const client of clientList) {
        if (client.url.includes("/restaurant/") && "focus" in client) {
          return client.focus();
        }
      }
      // otherwise, open a fresh tab straight to Orders
      if (clients.openWindow) {
        return clients.openWindow("/restaurant/orders");
      }
    })
  );
});