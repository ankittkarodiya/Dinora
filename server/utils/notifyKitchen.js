const { getIO } = require("../config/socket");
const PushSubscription = require("../models/PushSubscription");

const notifyNewOrder = async (order) => {
  try {
    getIO().to(`restaurant-${order.restaurantId}`).emit("newOrder", order);
  } catch (emitErr) {
    console.error("Socket emit failed:", emitErr.message);
  }

  try {
    const webpush = require("../config/webPush");
    const subscriptions = await PushSubscription.find({ restaurantId: order.restaurantId });

    const table = order.tableId;
    const payload = JSON.stringify({
      title: "New Order!",
      body: `${order.items.length} item${order.items.length !== 1 ? "s" : ""} · ${table?.name || "Unknown Table"}`,
      image: "https://www.dinora.in/icons/notification-banner.jpg",
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          .catch(async (err) => {
            if (err.statusCode === 410) {
              await PushSubscription.deleteOne({ endpoint: sub.endpoint });
            }
          })
      )
    );
  } catch (pushErr) {
    console.error("Push notification failed:", pushErr.message);
  }
};

module.exports = { notifyNewOrder };