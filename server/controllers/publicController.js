const { getIO } = require("../config/socket");

const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const Session = require("../models/Session");
const Order = require("../models/Order");
const Review = require("../models/Review");

const Customer = require("../models/Customer");

// new
const { sendNewOrderPush } = require("../utils/notifyKitchen");
const allowedOrigins = require("../config/allowedOrigins");

const getMenu = async (req, res) => {
  try {
    const { slug, tableId } = req.params;
    const restaurant = await Restaurant.findOne({ slug, isActive: true });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const isPro =
      restaurant.subscriptionPlan === "pro" &&
      restaurant.subscriptionStatus === "active";

    // all four are independent of each other, so they run in parallel
    const [table, categories, menuItems, ratingStats] = await Promise.all([
      Table.findOne({ _id: tableId, restaurantId: restaurant._id }),
      Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }),
      MenuItem.find({ restaurantId: restaurant._id }).lean(),
      // one aggregation for the whole menu (not one query per dish)
      isPro
        ? Review.aggregate([
            { $match: { restaurantId: restaurant._id } },
            {
              $group: {
                _id: "$menuItemId",
                avg: { $avg: "$rating" },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    const statsById = new Map(ratingStats.map((s) => [String(s._id), s]));
    const itemsWithRatings = menuItems.map((item) => {
      const s = statsById.get(String(item._id));
      return {
        ...item,
        ratingAvg: s ? Math.round(s.avg * 10) / 10 : null,
        ratingCount: s ? s.count : 0,
      };
    });

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo: restaurant.logo,
        phone: restaurant.phone,
        gstPercent: restaurant.gstPercent,
        subscriptionPlan: restaurant.subscriptionPlan,
      },
      table: {
        _id: table._id,
        name: table.name,
        capacity: table.capacity,
        isKiosk: !!table.isKiosk && isPro,
      },
      categories,
      menuItems: itemsWithRatings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.body;
    // always create a fresh session — do not reuse old ones
    const session = await Session.create({ restaurantId, tableId });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { restaurantId, sessionId, tableId, items, customerName, customerPhone } = req.body;

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

    // ── resolve customer ──────────────────────────────────────────────
    const isKiosk = table?.isKiosk === true;
    let customerId = null;

    if (!isKiosk) {
      if (req.customer?._id) {
        customerId = req.customer._id;
      } else if (customerName?.trim() && customerPhone?.trim()) {
        const cleanPhone = customerPhone.trim().replace(/\D/g, "").slice(-10);

        let customer = await Customer.findOne({
          $or: [
            { phone: cleanPhone, restaurantId },
            { phone: `+91${cleanPhone}`, restaurantId },
            { phone: `91${cleanPhone}`, restaurantId },
          ],
        });

        if (!customer) {
          customer = await Customer.create({
            username: customerName.trim(),
            phone: customerPhone.trim(),
            restaurantId,
          });
        }
        customerId = customer._id;
      }
    }

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

      const portion = i.portion || null;
      const price =
        portion === "half" && dbItem.halfPrice != null
          ? dbItem.halfPrice
          : dbItem.price;

      return {
        menuItemId: dbItem._id,
        name: dbItem.name,
        price,
        qty: i.qty,
        isVeg: dbItem.isVeg,
        portion,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstPercent = restaurant.gstPercent ?? 5;
    const gstAmount = Math.round(((subtotal * gstPercent) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // ── auto-assign the smallest free token ──
    const usedTokens = await Order.find({
      restaurantId,
      tokenActive: true,
    }).distinct("tokenNumber");

    const usedSet = new Set(usedTokens);
    let tokenNumber = 1;
    while (usedSet.has(tokenNumber)) tokenNumber++;

    const order = await Order.create({
      restaurantId,
      sessionId,
      tableId,
      customerId,
      items: orderItems,
      subtotal,
      gstPercent,
      gstAmount,
      totalAmount,
      status: "Pending",
      tokenNumber,
      tokenActive: true,
      visibleToKitchen: !isKiosk,
    });
    await Session.findByIdAndUpdate(sessionId, { $inc: { totalAmount } });

    // populate before emitting so admin's real-time listener gets
    // the exact same shape as getOrders() — ready to display immediately
    await order.populate("tableId", "name capacity");
    await order.populate("customerId", "username phone");

    // ── notify admin (normal tables only) ─────────────────────────────
    if (!isKiosk) {
      try {
        getIO().to(`restaurant-${restaurantId}`).emit("newOrder", order);
      } catch (emitErr) {
        console.error("Socket emit failed:", emitErr.message);
      }

      // web-push notification (normal tables only)
      // try {
      //   const webpush = require("../config/webPush");
      //   const PushSubscription = require("../models/PushSubscription");
      //   const subscriptions = await PushSubscription.find({ restaurantId });

      //   const payload = JSON.stringify({
      //     title: "New Order!",
      //     body: `${orderItems.length} item${orderItems.length !== 1 ? "s" : ""} · ${table?.name || "Unknown Table"}`,
      //     image: "https://www.dinora.in/icons/notification-banner.jpg",
      //   });

      //   await Promise.allSettled(
      //     subscriptions.map((sub) =>
      //       webpush
      //         .sendNotification(
      //           { endpoint: sub.endpoint, keys: sub.keys },
      //           payload,
      //         )
      //         .catch(async (err) => {
      //           if (err.statusCode === 410) {
      //             await PushSubscription.deleteOne({ endpoint: sub.endpoint });
      //           }
      //         }),
      //     ),
      //   );
      // } catch (pushErr) {
      //   console.error("Push notification failed:", pushErr.message);
      // }

      // new
      await sendNewOrderPush({
        restaurantId,
        itemCount: orderItems.length,
        tableName: table?.name,
      });

    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error);
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// cancelUnpaidOrder — called when the customer cancels payment on a
// kiosk, or when a QR-table customer's unpaid order goes stale.
// Frees the token and reverses the session total.
//
// Route: DELETE /api/public/orders/:id  (no auth needed — order ID is
//        the secret; only the customer who placed it has it)
// ─────────────────────────────────────────────────────────────────────
const cancelUnpaidOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // only cancel orders that are still Pending and unpaid
    if (order.status !== "Pending" || order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "This order can no longer be cancelled" });
    }

    order.status = "Cancelled";
    order.cancellationReason = "Payment not completed";
    await order.save(); // pre-save hook frees the token (tokenActive → false)

    // reverse the session total so it doesn't inflate on retry
    await Session.findByIdAndUpdate(order.sessionId, {
      $inc: { totalAmount: -order.totalAmount },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("CANCEL UNPAID ORDER ERROR:", error);
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// ── GET /api/public/orders/session/:sessionId ─────────────────────
// if customer logged in — show only their orders in this session
// if not logged in — show all orders in session
const getSessionOrders = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const query = { sessionId };

    if (req.customer?._id) {
      // logged in customer — only their orders
      query.customerId = req.customer._id;
    }

    const orders = await Order.find(query)
      .populate("tableId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
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
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// POST /api/public/reviews
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
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

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
    res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Something went wrong" : error.message });
  }
};

// GET /api/public/orders/customer-history
// Returns ALL orders ever placed by this logged-in customer at this restaurant
const getCustomerOrderHistory = async (req, res) => {
  try {
    if (!req.customer?._id) {
      return res.status(401).json({
        success: false,
        message: "Login required to view order history",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customerId: req.customer._id })
        .populate("tableId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ customerId: req.customer._id }),
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";
    res.status(500).json({ success: false, message: isProduction ? "Something went wrong" : error.message });
  }
};


// new
// GET /api/public/manifest/:slug
// A per-restaurant web-app manifest. Its scope is only "/<slug>/", so the installed
// app captures that restaurant's pages and NOT the landing page or other dinora.in links.
const getRestaurantManifest = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: String(req.params.slug || "").toLowerCase(),
    }).select("name slug");
    if (!restaurant) return res.status(404).json({ message: "Not found" });

    const origin = allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "https://www.dinora.in";
    const icon = (file, sizes, purpose = "any") => ({
      src: `${origin}/icons/${encodeURI(file)}`,
      sizes,
      type: "image/png",
      purpose,
    });

    res.set("Content-Type", "application/manifest+json");
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(
      JSON.stringify({
        id: `${origin}/${restaurant.slug}/`,
        name: `${restaurant.name} · Dinora`,
        short_name: restaurant.name.slice(0, 12),
        description: `Admin dashboard for ${restaurant.name}`,
        start_url: `${origin}/${restaurant.slug}/dashboard`,
        scope: `${origin}/${restaurant.slug}/`,
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          icon("icon-192 (1).png", "192x192"),
          icon("icon-512 (1).png", "512x512"),
          icon("icon-maskable-512 (1).png", "512x512", "maskable"),
        ],
      }),
    );
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};


module.exports = {
  getMenu,
  createSession,
  placeOrder,
  cancelUnpaidOrder,
  getSessionOrders,
  getReviewableItems,
  submitReview,
  getItemReviews,
  getCustomerOrderHistory,
  getRestaurantManifest,
};
