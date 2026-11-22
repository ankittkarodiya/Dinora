// ONE place that decides "is this restaurant allowed to run self-ordering kiosks?"
// Kiosk mode is a PRO feature. Same condition you already use for Pro-only
// features (ratings): plan is "pro" AND the subscription is active.
const isProActive = (restaurant) =>
  !!restaurant &&
  restaurant.subscriptionPlan === "pro" &&
  restaurant.subscriptionStatus === "active";

// A table only behaves as a kiosk if the flag is set AND the plan still allows it.
// (If a restaurant downgrades, its kiosk tables quietly go back to normal QR tables.)
const isKioskActive = (table, restaurant) => !!table?.isKiosk && isProActive(restaurant);

module.exports = { isProActive, isKioskActive };