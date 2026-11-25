const { getIO } = require("../config/socket");
const PushSubscription = require("../models/PushSubscription");

// Sends the out-of-app (web push) alert for a new order to every device
// subscribed for this restaurant. Logs what happened; never throws.
const sendNewOrderPush = async ({ restaurantId, itemCount, tableName }) => {
  try {
    const webpush = require("../config/webPush");
    const subscriptions = await PushSubscription.find({ restaurantId });
    if (subscriptions.length === 0) {
      console.log(`[push] no subscribed devices for restaurant ${restaurantId}`);
      return;
    }

    const payload = JSON.stringify({
      title: "New Order!",
      body: `${itemCount} item${itemCount !== 1 ? "s" : ""} · ${tableName || "Unknown Table"}`,
      image: "https://www.dinora.in/icons/notification-banner.jpg",
    });

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // "high" urgency so phones in battery-saving/idle mode still get it
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, {
            urgency: "high",
            TTL: 3600,
          });
          return true;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // this device's subscription is gone for good
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
            console.log("[push] removed an expired subscription");
          } else {
            console.error("[push] send failed:", err.statusCode, err.body || err.message);
          }
          return false;
        }
      }),
    );
    console.log(`[push] new order: ${results.filter(Boolean).length}/${subscriptions.length} devices notified`);
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

// socket (in-app) + push (out-of-app)
const notifyNewOrder = async (order) => {
  try {
    getIO().to(`restaurant-${order.restaurantId}`).emit("newOrder", order);
  } catch (emitErr) {
    console.error("Socket emit failed:", emitErr.message);
  }
  await sendNewOrderPush({
    restaurantId: order.restaurantId,
    itemCount: order.items.length,
    tableName: order.tableId?.name,
  });
};

module.exports = { notifyNewOrder, sendNewOrderPush };







































// const { getIO } = require("../config/socket");
// const PushSubscription = require("../models/PushSubscription");

// const notifyNewOrder = async (order) => {
//   try {
//     getIO().to(`restaurant-${order.restaurantId}`).emit("newOrder", order);
//   } catch (emitErr) {
//     console.error("Socket emit failed:", emitErr.message);
//   }

//   try {
//     const webpush = require("../config/webPush");
//     const subscriptions = await PushSubscription.find({ restaurantId: order.restaurantId });

//     const table = order.tableId;
//     const payload = JSON.stringify({
//       title: "New Order!",
//       body: `${order.items.length} item${order.items.length !== 1 ? "s" : ""} · ${table?.name || "Unknown Table"}`,
//       image: "https://www.dinora.in/icons/notification-banner.jpg",
//     });

//     await Promise.allSettled(
//       subscriptions.map((sub) =>
//         webpush
//           .sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
//           .catch(async (err) => {
//             if (err.statusCode === 410) {
//               await PushSubscription.deleteOne({ endpoint: sub.endpoint });
//             }
//           })
//       )
//     );
//   } catch (pushErr) {
//     console.error("Push notification failed:", pushErr.message);
//   }
// };

// module.exports = { notifyNewOrder };