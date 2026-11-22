const Order = require("../models/Order");

// Smallest free token number for this restaurant.
//  - "free" = not held by a LIVE order (tokenActive: true). Completed/Cancelled
//    orders release their token (Order.js pre-save hook), so numbers get reused.
//  - Also skips every token this SAME session has ever held, so a customer
//    who orders twice at the same table never gets the same token twice.
//  - If all 1..limit are busy this just keeps counting (limit+1, limit+2…):
//    the owner's limit is a warning threshold, never a reason to refuse an order.
const nextFreeToken = async (restaurantId, sessionId) => {
  const liveTokens = await Order.find({ restaurantId, tokenActive: true }).distinct("tokenNumber");
  const taken = new Set(liveTokens);

  if (sessionId) {
    const sessionTokens = await Order.find({ sessionId, tokenNumber: { $ne: null } }).distinct("tokenNumber");
    sessionTokens.forEach((t) => taken.add(t));
  }

  let n = 1;
  while (taken.has(n)) n++;
  return n;
};

// Creates the order with a token. Two customers ordering at the same instant
// could both be offered the same number; the partial unique index on
// { restaurantId, tokenNumber } (tokenActive: true) rejects the second one
// with E11000 — we simply pick the next free number and try again.
const createOrderWithToken = async (restaurantId, data, maxAttempts = 6) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tokenNumber = await nextFreeToken(restaurantId, data.sessionId);
    try {
      return await Order.create({
        ...data,
        restaurantId,
        tokenNumber,
        tokenActive: true,
      });
    } catch (err) {
      const isTokenClash = err?.code === 11000;
      if (!isTokenClash || attempt === maxAttempts) throw err;
      // someone grabbed that number first → loop and recompute
    }
  }
};

module.exports = { nextFreeToken, createOrderWithToken };