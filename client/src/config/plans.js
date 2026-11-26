// One place for the plan names customers SEE. The ids inside the app
// ("basic" / "pro") stay the same — only these display names change.
export const PLAN_NAMES = {
  basic: "Starter",
  pro: "Prime",
};

// The feature list shown on the landing page, setup and settings screens
export const PLAN_FEATURES = {
  basic: [
    "QR code for every table (up to 15 tables)",
    "Digital menu with photos, veg / non-veg tags and bestseller marks",
    "Live order tracking for kitchen and guests",
    "Counter Order screen with instant bill printing",
    "Bills with GST breakdown, or no tax lines at 0% GST",
    "Auto-assigned order tokens",
    "Your own restaurant link: dinora.in/your-restaurant",
    "Cash and online payments (your own Razorpay)",
    // "Online payments (your own Razorpay) or pay at the counter",
    "Order history with date filters",
    "Install as an app with push alerts for new orders",
  ],
  pro: [
    "Everything in " + PLAN_NAMES.basic,
    "Self-order kiosk with its own QR (guests order and pay online)",
    "Customer reviews and dish ratings",
    "Top-rated dishes ranking",
    "Revenue and order trend analytics",
    // "Cash vs online payment breakdown",
    "Paid before dining vs paid after dining breakdown",
    "Up to 30 tables",
  ],
};

// Landing-page offer. Edit the number/wording here and the page updates.
export const FOUNDING_OFFER = {
  spots: 50,
  label: "Founding offer",
};