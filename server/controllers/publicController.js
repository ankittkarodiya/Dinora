const { getIO } = require("../config/socket");

const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const Session = require("../models/Session");
const Order = require("../models/Order");
const Review = require("../models/Review");

// const getMenu = async (req, res) => {
//   try {
//     const { slug, tableId } = req.params;
//     const restaurant = await Restaurant.findOne({ slug, isActive: true });
//     if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });
//     const table = await Table.findOne({ _id: tableId, restaurantId: restaurant._id });
//     if (!table) return res.status(404).json({ success: false, message: "Table not found" });
//     const categories = await Category.find({ restaurantId: restaurant._id }).sort({ order: 1 });
//     const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
//     res.json({
//       success: true,
//       restaurant: { _id: restaurant._id, name: restaurant.name, slug: restaurant.slug, description: restaurant.description, logo: restaurant.logo,
//       gstPercent: restaurant.gstPercent, // ← this line was very likely missing
//       subscriptionPlan: restaurant.subscriptionPlan, // ← for pro
//       },
//       table: { _id: table._id, name: table.name, capacity: table.capacity },
//       categories,
//       menuItems,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// new
const getMenu = async (req, res) => {
  try {
    const { slug, tableId } = req.params;
    const restaurant = await Restaurant.findOne({ slug, isActive: true });
    if (!restaurant)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    // ← THE FIX: table, categories, and menu items don't depend on each other —
    // run all three simultaneously instead of one after another
    const [table, categories, menuItems] = await Promise.all([
      Table.findOne({ _id: tableId, restaurantId: restaurant._id }),
      Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }),
      MenuItem.find({ restaurantId: restaurant._id }),
    ]);

    if (!table)
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo: restaurant.logo,
        gstPercent: restaurant.gstPercent,
        subscriptionPlan: restaurant.subscriptionPlan,
      },
      table: { _id: table._id, name: table.name, capacity: table.capacity },
      categories,
      menuItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.body;
    // always create a fresh session — do not reuse old ones
    const session = await Session.create({ restaurantId, tableId });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const placeOrder = async (req, res) => {
//   try {
//     const { restaurantId, sessionId, tableId, items } = req.body;
//     if (!items || items.length === 0) {
//       return res.status(400).json({ success: false, message: "No items in order" });
//     }
//     const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
//     const order = await Order.create({
//       restaurantId, sessionId, tableId,
//       customerId: req.customer?._id || null,
//       items, totalAmount, status: "Pending",
//     });
//     await Session.findByIdAndUpdate(sessionId, { $inc: { totalAmount } });
//     res.status(201).json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// new place order
const placeOrder = async (req, res) => {
  try {
    const { restaurantId, sessionId, tableId, items } = req.body;

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items in order" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const table = await Table.findById(tableId);

    // fetch real, current prices from the DB — never trust client-sent prices
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId,
    });
    const dbItemMap = new Map(dbItems.map((m) => [m._id.toString(), m]));

    const orderItems = items.map((i) => {
      const dbItem = dbItemMap.get(i.menuItemId.toString());
      if (!dbItem)
        throw new Error(`One of the items in your cart is no longer available`);
      return {
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price, // ← authoritative, from DB
        qty: i.qty,
        isVeg: dbItem.isVeg,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstPercent = restaurant.gstPercent ?? 5;
    const gstAmount = Math.round(((subtotal * gstPercent) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // const order = await Order.create({
    //   restaurantId, sessionId, tableId,
    //   customerId: req.customer?._id || null,
    //   items: orderItems,
    //   subtotal, gstPercent, gstAmount, totalAmount,
    //   status: "Pending",
    // });
    // await Session.findByIdAndUpdate(sessionId, { $inc: { totalAmount } });
    // res.status(201).json({ success: true, order });

    // new
    const order = await Order.create({
      restaurantId,
      sessionId,
      tableId,
      customerId: req.customer?._id || null,
      items: orderItems,
      subtotal,
      gstPercent,
      gstAmount,
      totalAmount,
      status: "Pending",
    });
    await Session.findByIdAndUpdate(sessionId, { $inc: { totalAmount } });

    // populate before emitting, so the admin's real-time listener receives
    // the exact same shape as a normal getOrders() response — ready to
    // display immediately, matching every other order in the list
    await order.populate("tableId", "name capacity");
    await order.populate("customerId", "username phone");

    // a socket failure should never prevent an order from being placed —
    // this is a nice-to-have notification, not a critical path
    try {
      getIO().to(`restaurant-${restaurantId}`).emit("newOrder", order);
    } catch (emitErr) {
      console.error("Socket emit failed:", emitErr.message);
    }



    // new for web-push notifications
    // ← new: also send a real OS-level push notification, alongside the
    // socket emit. This is what actually reaches a device even if its
    // browser tab/PWA has been suspended or killed in the background —
    // something the socket alone can never do.
    // try {
    //   const webpush = require("../config/webPush");
    //   const PushSubscription = require("../models/PushSubscription");
    //   const subscriptions = await PushSubscription.find({ restaurantId });

    //   const payload = JSON.stringify({
    //     // title: "New Order!",
    //     // body: `${orderItems.length} item${orderItems.length !== 1 ? "s" : ""} · Table ${tableId}`,
    //     title: "Dinora — New Order!",
    //     body: `${orderItems.length} item${orderItems.length !== 1 ? "s" : ""} · ${table.name}`,
    //   });

    //   await Promise.allSettled(
    //     subscriptions.map((sub) =>
    //       webpush
    //         .sendNotification(
    //           { endpoint: sub.endpoint, keys: sub.keys },
    //           payload,
    //         )
    //         .catch(async (err) => {
    //           // a 410 Gone means this subscription is no longer valid
    //           // (browser data cleared, uninstalled, etc.) — clean it up
    //           if (err.statusCode === 410) {
    //             await PushSubscription.deleteOne({ endpoint: sub.endpoint });
    //           }
    //         }),
    //     ),
    //   );
    // } catch (pushErr) {
    //   console.error("Push notification failed:", pushErr.message);
    // }

    try {
  const webpush = require("../config/webPush");
  const PushSubscription = require("../models/PushSubscription");
  const subscriptions = await PushSubscription.find({ restaurantId });

  const payload = JSON.stringify({
    // title: "Dinora — New Order!",
    title: "New Order!",
    body: `${orderItems.length} item${orderItems.length !== 1 ? "s" : ""} · ${table?.name || "Unknown Table"}`,
    // new
    image: "https://www.dinora.in/icons/notification-banner.jpg",
  });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
        )
        .catch(async (err) => {
          if (err.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          }
        }),
    ),
  );
} catch (pushErr) {
  console.error("Push notification failed:", pushErr.message);
}



    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ── GET /api/public/orders/session/:sessionId ─────────────────────
// if customer logged in — show only their orders in this session
// if not logged in — show all orders in session
const getSessionOrders = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query = { sessionId, status: { $ne: "Cancelled" } };

    if (req.customer?._id) {
      // logged in customer — only their orders
      query.customerId = req.customer._id;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReviewableItems = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query = {
      sessionId,
      status: { $in: ["Served", "Completed"] },
    };
    // only show items from this customer's orders
    if (req.customer?._id) {
      query.customerId = req.customer._id;
    }
    const orders = await Order.find(query);
    if (!orders.length) return res.json({ success: true, items: [] });
    const itemMap = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.menuItemId.toString();
        if (!itemMap[id]) {
          itemMap[id] = {
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
          };
        }
      });
    });
    res.json({ success: true, items: Object.values(itemMap) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const submitReview = async (req, res) => {
//   try {
//     const { restaurantId, menuItemId, sessionId, rating, text } = req.body;
//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
//     }
//     // verify item was served in this customer's order
//     const servedOrder = await Order.findOne({
//       sessionId,
//       customerId: req.customer._id,
//       status: { $in: ["Served", "Completed"] },
//       "items.menuItemId": menuItemId,
//     });
//     if (!servedOrder) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only review items from your served orders",
//       });
//     }
//     const customerName = req.customer.username || `Customer ${req.customer.phone.slice(-4)}`;
//     const existing = await Review.findOne({ menuItemId, customerId: req.customer._id });
//     if (existing) {
//       existing.rating = rating;
//       existing.text = text;
//       await existing.save();
//       return res.json({ success: true, review: existing });
//     }
//     const review = await Review.create({
//       restaurantId, menuItemId,
//       customerId: req.customer._id,
//       customerName, rating, text,
//     });
//     res.status(201).json({ success: true, review });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// new
// POST /api/public/reviews
// Customer submits a review — must be logged in via protectCustomer

// const submitReview = async (req, res) => {
//   try {
//     const { restaurantId, menuItemId, sessionId, rating, text } = req.body;

//     if (!restaurantId || !menuItemId || !sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "restaurantId, menuItemId and sessionId are required",
//       });
//     }

//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: "Rating must be between 1 and 5",
//       });
//     }

//     // verify the item was served in this customer's order
//     const servedOrder = await Order.findOne({
//       sessionId,
//       customerId: req.customer._id,
//       status: { $in: ["Served", "Completed"] },
//       "items.menuItemId": menuItemId,
//     });

//     if (!servedOrder) {
//       return res.status(403).json({
//         success: false,
//         message: "You can only review items from your served orders",
//       });
//     }

//     const customerName =
//       req.customer.username && req.customer.username.trim()
//         ? req.customer.username
//         : `Guest ${req.customer.phone.slice(-4)}`;

//     // update if already reviewed
//     const existing = await Review.findOne({
//       menuItemId,
//       customerId: req.customer._id,
//     });

//     if (existing) {
//       existing.rating = rating;
//       existing.text = text || "";
//       await existing.save();
//       return res.json({ success: true, review: existing, updated: true });
//     }

//     const review = await Review.create({
//       restaurantId,
//       menuItemId,
//       customerId: req.customer._id,
//       customerName,
//       rating,
//       text: text || "",
//     });

//     res.status(201).json({ success: true, review, updated: false });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const getItemReviews = async (req, res) => {
//   try {
//     const reviews = await Review.find({ menuItemId: req.params.menuItemId }).sort({ createdAt: -1 });
//     const avg = reviews.length
//       ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
//       : null;
//     res.json({ success: true, reviews, avgRating: avg });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// new submit review
const submitReview = async (req, res) => {
  try {
    const { restaurantId, menuItemId, sessionId, rating, text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const servedOrder = await Order.findOne({
      sessionId,
      customerId: req.customer._id,
      status: { $in: ["Served", "Completed"] },
      "items.menuItemId": menuItemId,
    });

    if (!servedOrder) {
      return res.status(403).json({
        success: false,
        message: "You can only review items from your served orders",
      });
    }

    const customerName =
      req.customer.username?.trim() || `Guest ${req.customer.phone.slice(-4)}`;

    // ALWAYS create a new review — multiple reviews per customer allowed
    const review = await Review.create({
      restaurantId,
      menuItemId,
      customerId: req.customer._id,
      customerName,
      rating,
      text: text || "",
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// new
// GET /api/public/reviews/:menuItemId
const getItemReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      menuItemId: req.params.menuItemId,
    }).sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ success: true, reviews, avgRating, total: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// new for customer history
// GET /api/public/orders/customer-history
// Returns ALL orders ever placed by this logged-in customer at this restaurant
// Unlike getSessionOrders, this is NOT scoped to one session — it's the customer's full history
const getCustomerOrderHistory = async (req, res) => {
  try {
    if (!req.customer?._id) {
      return res.status(401).json({
        success: false,
        message: "Login required to view order history",
      });
    }

    const orders = await Order.find({
      customerId: req.customer._id,
      status: { $ne: "Cancelled" },
    })
      .populate("tableId", "name")
      .sort({ createdAt: -1 }); // most recent first

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMenu,
  createSession,
  placeOrder,
  getSessionOrders,
  getReviewableItems,
  submitReview,
  getItemReviews,
  getCustomerOrderHistory,
};
